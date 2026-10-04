import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  Award,
  Lock,
  Crown,
  Gift,
  X
} from 'lucide-react';
import { 
  StreakState, 
  DAILY_TASKS, 
  TaskActivity, 
  getStreakData, 
  recordTaskCompletion, 
  getWeekDays, 
  getMilestoneProgress,
  formatDateToYMD,
  AchievementBadge,
  STREAK_ACHIEVEMENT_BADGES,
  getBadgeStatus
} from '../lib/streak';

interface DailyStreakTrackerProps {
  user: User | null;
  setActiveTab: (tab: string) => void;
  onStreakUpdate?: (newStreak: number) => void;
}

export function DailyStreakTracker({ user, setActiveTab, onStreakUpdate }: DailyStreakTrackerProps) {
  const [streakData, setStreakData] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: '',
    activeDates: [],
    todayCompletedTasks: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [justLoggedTask, setJustLoggedTask] = useState<string | null>(null);

  const todayStr = formatDateToYMD();
  const isCompletedToday = streakData.activeDates.includes(todayStr) || streakData.todayCompletedTasks.length > 0;
  const highestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);

  const coreMilestones = STREAK_ACHIEVEMENT_BADGES.filter(b => [7, 30, 100].includes(b.daysRequired));

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getStreakData(user);
        if (isMounted) {
          setStreakData(data);
          onStreakUpdate?.(data.currentStreak);
        }
      } catch (err) {
        console.error("Error loading streak data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCompleteTask = async (task: TaskActivity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await recordTaskCompletion(task.id, user);
      setStreakData(updated);
      setJustLoggedTask(task.id);
      setShowCelebration(true);
      onStreakUpdate?.(updated.currentStreak);

      setTimeout(() => {
        setShowCelebration(false);
        setJustLoggedTask(null);
      }, 3500);
    } catch (err) {
      console.error("Failed to record task completion:", err);
    }
  };

  const handleQuickCheckIn = async () => {
    await handleCompleteTask({
      id: 'daily_checkin',
      title: 'Daily Platform Check-In',
      description: 'Checked into PrepAI dashboard',
      tab: 'home',
      category: 'mentor',
      xp: 25
    });
  };

  const weekDays = getWeekDays(streakData.activeDates);
  const milestone = getMilestoneProgress(streakData.currentStreak);

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/60 mb-8 transition-all duration-300" id="daily-streak-tracker-root">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
      
      {/* Celebration Notification */}
      {showCelebration && (
        <div className="absolute top-4 right-4 z-30 animate-bounce bg-emerald-400 text-emerald-950 px-4 py-2 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2 border border-emerald-300">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Streak Extended! +{streakData.currentStreak} Days 🔥</span>
        </div>
      )}

      {/* Top Bar: Title & Flame Hero */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-emerald-800/60">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
              isCompletedToday 
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-orange-500/30 scale-105 ring-4 ring-orange-400/20' 
                : 'bg-emerald-800/80 border border-emerald-700/80 text-emerald-300'
            }`}>
              <Flame className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-500 ${
                isCompletedToday ? 'text-white fill-white animate-pulse' : 'text-emerald-400'
              }`} />
            </div>
            {isCompletedToday && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-emerald-950"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-800/70 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Prep Consistency
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isCompletedToday 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
              }`}>
                {isCompletedToday ? '✓ Active Today' : '⚡ Task Due Today'}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {streakData.currentStreak} <span className="text-xl sm:text-2xl font-bold text-emerald-300">Day Streak</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/70 mt-0.5">
              {isCompletedToday 
                ? 'You maintained your streak today! Unlock 7, 30, and 100-day achievement badges below.' 
                : 'Complete at least 1 prep task today to keep your consecutive day streak alive.'}
            </p>
          </div>
        </div>

        {/* Quick Check-In / Status Action */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {!isCompletedToday ? (
            <button
              onClick={handleQuickCheckIn}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer group"
            >
              <Flame className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Log Today's Prep</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-800/60 border border-emerald-700/60 px-4 py-2.5 rounded-2xl text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Streak Protected for Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Bento Grid for Streak */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Left Column: 7-Day Activity History & Milestone (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Week Visualizer */}
          <div className="bg-emerald-900/50 backdrop-blur-md rounded-2xl p-5 border border-emerald-800/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 tracking-wide uppercase">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last 7 Days Activity</span>
              </div>
              <span className="text-[11px] text-emerald-300/80 font-medium">
                {streakData.totalActiveDays} Total Days Practiced
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all ${
                    day.isToday
                      ? day.isActive
                        ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/20 border-amber-400/60 shadow-md ring-2 ring-amber-400/30'
                        : 'bg-emerald-800/80 border-emerald-600/80 ring-2 ring-emerald-400/40'
                      : day.isActive
                      ? 'bg-emerald-800/40 border-emerald-700/60 text-emerald-200'
                      : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-600/60 opacity-60'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold uppercase text-emerald-300/80 mb-1">
                    {day.dayName}
                  </span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                    day.isActive
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm'
                      : day.isToday
                      ? 'bg-emerald-700/70 text-emerald-200 border border-dashed border-emerald-500'
                      : 'bg-emerald-900/40 text-emerald-500'
                  }`}>
                    {day.isActive ? (
                      <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                    ) : day.isToday ? (
                      <Circle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[11px] font-normal">{day.dayNumber}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-emerald-400/70 truncate">
                    {day.shortDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Tier Progress */}
          <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-5 border border-emerald-800/70 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{milestone.badgeEmoji}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{milestone.currentTier}</h4>
                  <p className="text-[11px] text-emerald-300/70">
                    {milestone.daysToNext > 0
                      ? `${milestone.daysToNext} more days to unlock "${milestone.nextTier}"`
                      : 'Milestone Achieved! Outstanding dedication.'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-300">
                  {milestone.progressPercent}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-emerald-950/80 rounded-full h-2.5 overflow-hidden border border-emerald-800/60 mb-3">
              <div 
                className="bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${milestone.progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] italic text-emerald-200/60">
              {milestone.quote}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-900/30 border border-emerald-800/50 p-3 rounded-xl">
              <div className="text-xs font-medium text-emerald-300/70">Current Streak</div>
              <div className="text-lg font-black text-white mt-0.5">{streakData.currentStreak} Days</div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-800/50 p-3 rounded-xl">
              <div className="text-xs font-medium text-emerald-300/70">Longest Record</div>
              <div className="text-lg font-black text-amber-300 mt-0.5">{streakData.longestStreak} Days</div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-800/50 p-3 rounded-xl">
              <div className="text-xs font-medium text-emerald-300/70">Lifetime Days</div>
              <div className="text-lg font-black text-teal-300 mt-0.5">{streakData.totalActiveDays} Days</div>
            </div>
          </div>

        </div>

        {/* Right Column: Daily Quest / Task Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-emerald-900/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Today's Daily Tasks</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                {streakData.todayCompletedTasks.length}/{DAILY_TASKS.length} Completed
              </span>
            </div>
            
            <p className="text-xs text-emerald-200/70 mb-4">
              Engage with any task below to automatically extend your streak:
            </p>

            {/* Task Item List */}
            <div className="space-y-2.5">
              {DAILY_TASKS.map((task) => {
                const isDone = streakData.todayCompletedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTab(task.tab)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200 opacity-90'
                        : 'bg-emerald-800/40 hover:bg-emerald-800/70 border-emerald-700/50 text-white hover:border-emerald-500/80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={(e) => handleCompleteTask(task, e)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-emerald-950'
                            : 'border border-emerald-400/60 hover:bg-emerald-600/40 text-transparent'
                        }`}
                        title={isDone ? "Completed today" : "Mark as completed"}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h5 className={`text-xs font-bold truncate ${isDone ? 'line-through text-emerald-300/80' : 'text-white'}`}>
                            {task.title}
                          </h5>
                          <span className="text-[10px] font-semibold text-amber-300/80 bg-amber-400/10 px-1.5 py-0.2 rounded shrink-0">
                            +{task.xp} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300/60 truncate mt-0.5">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-emerald-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-300/70">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Practice daily for interview readiness
            </span>
            <button
              onClick={() => setActiveTab('interview')}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              Start Practice <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Embedded 7, 30, and 100-Day Milestone Rewards Showcase */}
      <div className="relative z-10 mt-8 pt-6 border-t border-emerald-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white tracking-wide uppercase">
              Milestone Rewards & Achievement Badges (7, 30 & 100 Days)
            </h3>
          </div>
          <span className="text-xs text-emerald-300/80">
            Click any crest to inspect rewards & unlocked perks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coreMilestones.map((badge) => {
            const status = getBadgeStatus(badge, streakData.currentStreak, streakData.longestStreak);
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${
                  status.isUnlocked
                    ? 'bg-emerald-900/80 border-emerald-400/60 shadow-lg shadow-emerald-500/20 hover:scale-[1.02]'
                    : 'bg-emerald-950/60 border-emerald-800/60 opacity-80 hover:opacity-100 hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${
                    status.isUnlocked
                      ? `bg-gradient-to-tr ${badge.gradient} text-white shadow-md ring-2 ring-emerald-300/30`
                      : 'bg-emerald-900/60 text-emerald-500 grayscale'
                  }`}>
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-400">
                        {badge.daysRequired}-Day Streak
                      </span>
                      <span className="text-emerald-400/60">•</span>
                      <span className="text-[11px] font-semibold text-emerald-300">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {badge.name}
                    </h4>
                    <p className="text-[11px] text-emerald-200/60 truncate">
                      {status.isUnlocked ? 'Unlocked Perk Ready' : `${status.daysLeft} days to unlock`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {status.isUnlocked ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow">
                      <CheckCircle2 className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-900/80 text-emerald-400 border border-emerald-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      {status.progressPercent}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Inspection Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-gray-900 relative animate-fadeIn">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const status = getBadgeStatus(selectedBadge, streakData.currentStreak, streakData.longestStreak);
              return (
                <div className="text-center space-y-5">
                  <div className="flex justify-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl ${
                      status.isUnlocked
                        ? `bg-gradient-to-tr ${selectedBadge.gradient} text-white shadow-lg ring-4 ring-amber-400/20 animate-bounce`
                        : 'bg-gray-150 text-gray-400 border border-gray-200 grayscale'
                    }`}>
                      {selectedBadge.icon}
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedBadge.badgeTitle}</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">
                      {selectedBadge.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {selectedBadge.rewardDescription}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-150 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>Rewards & Privilege</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Milestone Target:</span>
                      <span className="font-bold text-gray-900">{selectedBadge.daysRequired}-Day Streak</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Reward XP:</span>
                      <span className="font-bold text-emerald-600">+{selectedBadge.xpReward} XP</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-gray-200">
                      <span className="text-gray-500 shrink-0">Unlocked Perk:</span>
                      <span className="font-semibold text-gray-900 text-right">{selectedBadge.perk}</span>
                    </div>
                  </div>

                  <div>
                    {status.isUnlocked ? (
                      <div className="bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Achievement Badge Unlocked & Active!</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                          <span>Streak Progress</span>
                          <span className="text-amber-700">{status.highestStreak}/{selectedBadge.daysRequired} Days</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${status.progressPercent}%` }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBadge(null);
                            setActiveTab('interview');
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Flame className="w-4 h-4 fill-current" />
                          <span>Practice Interview to Build Streak</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
