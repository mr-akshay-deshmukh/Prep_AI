import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface TaskActivity {
  id: string;
  title: string;
  description: string;
  tab: string;
  category: 'interview' | 'resume' | 'tracker' | 'mentor' | 'skills';
  xp: number;
}

export const DAILY_TASKS: TaskActivity[] = [
  {
    id: 'interview_prep',
    title: 'Answer 1 AI Mock Question',
    description: 'Practice speech & technical response with AI interviewer',
    tab: 'interview',
    category: 'interview',
    xp: 50
  },
  {
    id: 'resume_polish',
    title: 'Polish Resume or Analyze ATS Score',
    description: 'Review sections, format bullet points, or upload draft',
    tab: 'builder',
    category: 'resume',
    xp: 40
  },
  {
    id: 'job_track',
    title: 'Update Job Tracker Pipeline',
    description: 'Log new application, update interview stages, or set reminders',
    tab: 'tracker',
    category: 'tracker',
    xp: 30
  },
  {
    id: 'mentor_chat',
    title: 'Consult AI Career Mentor',
    description: 'Discuss salary, career path strategy, or system design tips',
    tab: 'chat',
    category: 'mentor',
    xp: 35
  }
];

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  activeDates: string[]; // YYYY-MM-DD[]
  todayCompletedTasks: string[];
}

export function formatDateToYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToYMD(d);
}

/**
 * Calculates current streak, longest streak, and total unique active days
 */
export function calculateStreakStats(datesList: string[]): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
} {
  const uniqueDates = Array.from(new Set(datesList.filter(Boolean))).sort();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const todayStr = formatDateToYMD();
  const yesterdayStr = getYesterdayYMD();

  // Create set for fast lookup
  const dateSet = new Set(uniqueDates);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If today is active, start counting backwards from today
  if (dateSet.has(todayStr)) {
    while (dateSet.has(formatDateToYMD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // If today is not yet active but yesterday was, streak is intact!
    checkDate.setDate(checkDate.getDate() - 1); // start at yesterday
    while (dateSet.has(formatDateToYMD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    currentStreak = 0;
  }

  // 2. Calculate Longest Streak in history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of uniqueDates) {
    const [y, m, d] = dStr.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: uniqueDates.length
  };
}

const LOCAL_STORAGE_KEY = 'prepai_daily_streak_data';

export async function getStreakData(user: User | null): Promise<StreakState> {
  const todayStr = formatDateToYMD();
  let localState: StreakState | null = null;

  // 1. Try reading local storage
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      localState = JSON.parse(stored);
    } catch (_) {}
  }

  let activeDates: string[] = localState?.activeDates || [];
  let todayTasks: string[] = [];

  // Also include dates from other local features if present (like interview history)
  try {
    const interviewHistory = localStorage.getItem('prep_ai_interview_history');
    if (interviewHistory) {
      const parsed = JSON.parse(interviewHistory);
      if (Array.isArray(parsed)) {
        parsed.forEach((session: any) => {
          if (session.date) {
            activeDates.push(formatDateToYMD(new Date(session.date)));
          }
        });
      }
    }
  } catch (_) {}

  // 2. If logged in, fetch from Firestore
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.streak?.activeDates && Array.isArray(data.streak.activeDates)) {
          activeDates = [...activeDates, ...data.streak.activeDates];
        }
        if (data.lastLogin) {
          activeDates.push(formatDateToYMD(new Date(data.lastLogin)));
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote streak, using local:", err);
    }
  }

  // Deduplicate activeDates
  activeDates = Array.from(new Set(activeDates.filter(Boolean)));

  // If local state had tasks completed today
  if (localState && localState.lastActiveDate === todayStr && Array.isArray(localState.todayCompletedTasks)) {
    todayTasks = localState.todayCompletedTasks;
  }

  const stats = calculateStreakStats(activeDates);

  const finalState: StreakState = {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalActiveDays: stats.totalActiveDays,
    lastActiveDate: activeDates.includes(todayStr) ? todayStr : (localState?.lastActiveDate || getYesterdayYMD()),
    activeDates,
    todayCompletedTasks: todayTasks
  };

  // Cache locally
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalState));
  } catch (_) {}

  return finalState;
}

export async function recordTaskCompletion(
  taskId: string,
  user: User | null
): Promise<StreakState> {
  const todayStr = formatDateToYMD();
  const currentData = await getStreakData(user);

  const updatedDates = Array.from(new Set([...currentData.activeDates, todayStr]));
  const updatedTodayTasks = Array.from(new Set([...currentData.todayCompletedTasks, taskId]));

  const stats = calculateStreakStats(updatedDates);

  const newState: StreakState = {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalActiveDays: stats.totalActiveDays,
    lastActiveDate: todayStr,
    activeDates: updatedDates,
    todayCompletedTasks: updatedTodayTasks
  };

  // Save to local storage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
  } catch (_) {}

  // Sync to Firestore if authenticated
  if (user) {
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          streak: {
            currentStreak: newState.currentStreak,
            longestStreak: newState.longestStreak,
            lastActiveDate: todayStr,
            activeDates: newState.activeDates
          },
          lastLogin: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to sync streak to Firestore:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  }

  return newState;
}

export interface WeekDayStatus {
  dayName: string;
  dayNumber: number;
  shortDate: string;
  dateStr: string;
  isActive: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getWeekDays(activeDates: string[]): WeekDayStatus[] {
  const dateSet = new Set(activeDates);
  const now = new Date();
  const todayStr = formatDateToYMD(now);
  
  // Get start of the current week (e.g. Monday or last 7 days)
  // Let's show the last 7 days window ending with today or current week
  const days: WeekDayStatus[] = [];
  
  // Last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToYMD(d);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const shortDate = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    
    days.push({
      dayName,
      dayNumber: d.getDate(),
      shortDate,
      dateStr,
      isActive: dateSet.has(dateStr),
      isToday: dateStr === todayStr,
      isFuture: false
    });
  }

  return days;
}

export interface MilestoneProgress {
  currentTier: string;
  badgeEmoji: string;
  nextTier: string;
  daysToNext: number;
  progressPercent: number;
  quote: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  daysRequired: number;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'emerald';
  badgeTitle: string;
  rewardTitle: string;
  rewardDescription: string;
  perk: string;
  xpReward: number;
  gradient: string;
  borderGlow: string;
  bgGlow: string;
}

export const STREAK_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'badge_3_ignite',
    name: 'Momentum Ignition',
    daysRequired: 3,
    icon: '🔥',
    tier: 'bronze',
    badgeTitle: '3-Day Momentum Badge',
    rewardTitle: '+100 XP Boost & Starter Flair',
    rewardDescription: 'Established a consistent daily practice routine across 3 consecutive days.',
    perk: 'Unlocks PrepAI Daily Habit Checklist & Starter XP Boost',
    xpReward: 100,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    borderGlow: 'border-orange-500/50 shadow-orange-500/20',
    bgGlow: 'bg-orange-500/10'
  },
  {
    id: 'badge_7_warrior',
    name: 'Week Warrior',
    daysRequired: 7,
    icon: '⚡',
    tier: 'emerald',
    badgeTitle: '7-Day Week Warrior Badge',
    rewardTitle: '+250 XP Boost & Bronze Placement Shield',
    rewardDescription: 'Completed an entire 7-day week of continuous career and interview preparation.',
    perk: 'Unlocks STAR Method Quick Reference Guide & +250 XP',
    xpReward: 250,
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    borderGlow: 'border-emerald-400/60 shadow-emerald-500/30',
    bgGlow: 'bg-emerald-500/15'
  },
  {
    id: 'badge_14_consistency',
    name: 'Consistency Pro',
    daysRequired: 14,
    icon: '🏆',
    tier: 'silver',
    badgeTitle: '14-Day Consistency Pro Badge',
    rewardTitle: '+500 XP Boost & Silver Interview Medallion',
    rewardDescription: 'Two full weeks of relentless dedication to mastering placement hurdles.',
    perk: 'Unlocks System Design Cheat Sheet & Silver Profile Medallion',
    xpReward: 500,
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    borderGlow: 'border-cyan-400/60 shadow-cyan-500/30',
    bgGlow: 'bg-cyan-500/15'
  },
  {
    id: 'badge_30_master',
    name: 'Placement Master',
    daysRequired: 30,
    icon: '👑',
    tier: 'gold',
    badgeTitle: '30-Day Placement Master Crown',
    rewardTitle: '+1,500 XP Boost & Gold Master Crown',
    rewardDescription: 'One full month of unstoppable consistency. Ready to conquer technical and behavioral rounds.',
    perk: 'Unlocks Executive & FAANG Mock Persona Pack + Gold Crown Avatar Flair',
    xpReward: 1500,
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    borderGlow: 'border-amber-400/80 shadow-amber-500/40 ring-2 ring-amber-400/30',
    bgGlow: 'bg-amber-500/20'
  },
  {
    id: 'badge_60_leader',
    name: 'Industry Leader',
    daysRequired: 60,
    icon: '🚀',
    tier: 'diamond',
    badgeTitle: '60-Day Industry Leader Insignia',
    rewardTitle: '+3,000 XP Boost & Titanium Insignia',
    rewardDescription: 'Two months of top-tier interview discipline, placing you in the top 5% of candidates.',
    perk: 'Unlocks Advanced Behavioral Scenario Vault + Priority AI Feedback',
    xpReward: 3000,
    gradient: 'from-indigo-400 via-purple-500 to-pink-500',
    borderGlow: 'border-purple-400/70 shadow-purple-500/30',
    bgGlow: 'bg-purple-500/15'
  },
  {
    id: 'badge_100_legend',
    name: 'Century Legend',
    daysRequired: 100,
    icon: '💎',
    tier: 'diamond',
    badgeTitle: '100-Day Diamond Legend Crest',
    rewardTitle: '+5,000 XP Boost & Diamond Hall of Fame Crest',
    rewardDescription: 'Triple-digit mastery! You have achieved legendary dedication and guaranteed placement readiness.',
    perk: 'Permanent Diamond Hall of Fame Status, Master AI Career Coach & Lifetime Legend Crest',
    xpReward: 5000,
    gradient: 'from-fuchsia-400 via-purple-400 to-cyan-400',
    borderGlow: 'border-cyan-300 shadow-cyan-400/50 ring-4 ring-cyan-300/30 animate-pulse',
    bgGlow: 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-fuchsia-500/20'
  }
];

export function getBadgeStatus(badge: AchievementBadge, currentStreak: number, longestStreak: number = 0) {
  const highestStreak = Math.max(currentStreak, longestStreak);
  const isUnlocked = highestStreak >= badge.daysRequired;
  const daysLeft = Math.max(0, badge.daysRequired - highestStreak);
  const progressPercent = Math.min(100, Math.max(0, Math.round((highestStreak / badge.daysRequired) * 100)));

  return {
    isUnlocked,
    daysLeft,
    progressPercent,
    highestStreak
  };
}

export function getMilestoneProgress(currentStreak: number): MilestoneProgress {
  const milestones = [
    { threshold: 1, title: 'Ignition Spark', emoji: '✨' },
    { threshold: 3, title: '3-Day Momentum', emoji: '🔥' },
    { threshold: 7, title: '7-Day Week Warrior', emoji: '⚡' },
    { threshold: 14, title: '14-Day Consistency Master', emoji: '🏆' },
    { threshold: 30, title: '30-Day Placement Ready', emoji: '👑' },
    { threshold: 60, title: '60-Day Industry Leader', emoji: '🚀' },
    { threshold: 100, title: '100-Day Legend', emoji: '💎' }
  ];

  let currentTier = 'Getting Started';
  let badgeEmoji = '🌱';
  let nextThreshold = 3;
  let nextTier = '3-Day Momentum';
  let prevThreshold = 0;

  for (let i = 0; i < milestones.length; i++) {
    if (currentStreak >= milestones[i].threshold) {
      currentTier = milestones[i].title;
      badgeEmoji = milestones[i].emoji;
      prevThreshold = milestones[i].threshold;
      if (i + 1 < milestones.length) {
        nextThreshold = milestones[i + 1].threshold;
        nextTier = milestones[i + 1].title;
      } else {
        nextThreshold = milestones[i].threshold + 30;
        nextTier = 'Next Century Milestone';
      }
    } else {
      nextThreshold = milestones[i].threshold;
      nextTier = milestones[i].title;
      break;
    }
  }

  const range = nextThreshold - prevThreshold;
  const progress = currentStreak - prevThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  const daysToNext = Math.max(0, nextThreshold - currentStreak);

  const quotes = [
    "“Success in tech interviews is built on daily habits, not last-minute cramming.”",
    "“Consistency is the bridge between average skills and dream offers.”",
    "“15 minutes of structured prep every day outperforms 5 hours once a week.”",
    "“Every question you solve today builds confidence for the real interview tomorrow.”",
    "“Small daily improvements over time lead to stunning career transformations.”"
  ];

  const quoteIndex = currentStreak % quotes.length;

  return {
    currentTier,
    badgeEmoji,
    nextTier,
    daysToNext,
    progressPercent,
    quote: quotes[quoteIndex]
  };
}
