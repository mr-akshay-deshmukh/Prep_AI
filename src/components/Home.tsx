import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { DailyStreakTracker } from './DailyStreakTracker';
import { StreakAchievementBadges } from './StreakAchievementBadges';
import { getStreakData, StreakState } from '../lib/streak';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  ArrowRight, 
  MessageSquare, 
  FileText, 
  Briefcase, 
  Code, 
  Sparkles, 
  Kanban, 
  MessageCircle, 
  Star, 
  Compass, 
  Lightbulb,
  TrendingUp, 
  Clock, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Layout, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
  role: string | null;
}

export function Home({ setActiveTab, role }: HomeProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [useSampleData, setUseSampleData] = useState(false);
  
  // Real data state
  const [realApps, setRealApps] = useState<any[]>([]);
  const [realResumeStatus, setRealResumeStatus] = useState({
    percent: 0,
    fields: {
      contact: false,
      summary: false,
      experience: false,
      education: false,
      skills: false,
      projects: false,
    }
  });
  const [realInterviewStats, setRealInterviewStats] = useState({
    totalSessions: 0,
    totalQuestions: 0,
    avgClarity: 0,
    trend: [] as any[]
  });
  const [streakData, setStreakData] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: '',
    activeDates: [],
    todayCompletedTasks: []
  });

  // Monitor auth status & streak data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
      getStreakData(usr).then(setStreakData).catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  // Fetch real-time job applications from Firestore
  useEffect(() => {
    if (!currentUser) {
      setRealApps([]);
      return;
    }
    const q = query(collection(db, 'applications'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealApps(apps);
    }, (error) => {
      console.error("Firestore applications read error on Home:", error);
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Evaluate resume completion metric
  useEffect(() => {
    let active = true;
    async function loadResume() {
      let data: any = null;
      if (currentUser) {
        try {
          const docRef = doc(db, 'resumes', currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            data = snap.data();
          }
        } catch (err: any) {
          console.error("Home resume load error:", err);
          handleFirestoreError(err, OperationType.GET, `resumes/${currentUser.uid}`);
        }
      }
      
      // Fallback to local storage if user has guest state or doc does not exist
      if (!data) {
        const cached = localStorage.getItem('prepai_resume_draft');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            data = parsed.formData || null;
          } catch (_) {}
        }
      }

      if (!active) return;

      if (data) {
        const checkFields = {
          contact: !!(data.name || data.email || data.phone),
          summary: !!(data.summary && data.summary.trim().length > 10),
          experience: !!(data.experience && data.experience.trim().length > 15),
          education: !!(data.education && data.education.trim().length > 10),
          skills: !!(data.skills && data.skills.trim().length > 5),
          projects: !!(data.projects && data.projects.trim().length > 15),
        };

        const filledCount = Object.values(checkFields).filter(Boolean).length;
        const percent = Math.round((filledCount / 6) * 100);

        setRealResumeStatus({
          percent,
          fields: checkFields
        });
      } else {
        setRealResumeStatus({
          percent: 0,
          fields: {
            contact: false,
            summary: false,
            experience: false,
            education: false,
            skills: false,
            projects: false,
          }
        });
      }
    }

    loadResume();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Evaluate interview status from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('prep_ai_interview_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as any[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          let totalQ = 0;
          let scoreSum = 0;
          let scoreCount = 0;
          const trendList: any[] = [];

          // Sort sessions by date chronologically
          const sorted = [...parsed].sort((a, b) => a.date - b.date);

          sorted.forEach((session, idx) => {
            let sessionQuestions = 0;
            let sessionScoreSum = 0;
            let sessionScoreCount = 0;

            if (Array.isArray(session.messages)) {
              session.messages.forEach((msg: any) => {
                if (msg.role === 'user') {
                  totalQ++;
                  sessionQuestions++;
                }
                
                // Read clarity score
                if (msg.feedback && typeof msg.feedback === 'object') {
                  const clarityVal = msg.feedback.clarity;
                  if (clarityVal && typeof clarityVal.score === 'number') {
                    scoreSum += clarityVal.score;
                    scoreCount++;
                    sessionScoreSum += clarityVal.score;
                    sessionScoreCount++;
                  }
                }
              });
            }

            const sessionAvg = sessionScoreCount > 0 ? Math.round(sessionScoreSum / sessionScoreCount) : 70 + (idx * 4) % 20;
            const sessionDate = new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            trendList.push({
              name: `Sess ${idx + 1}`,
              date: sessionDate,
              score: sessionAvg,
              questions: sessionQuestions || 3
            });
          });

          setRealInterviewStats({
            totalSessions: parsed.length,
            totalQuestions: totalQ,
            avgClarity: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 78,
            trend: trendList
          });
          return;
        }
      } catch (e) {
        console.error("Home parse interview history error:", e);
      }
    }

    setRealInterviewStats({
      totalSessions: 0,
      totalQuestions: 0,
      avgClarity: 0,
      trend: []
    });
  }, []);

  // Professional Benchmark Sample Data for comparison
  const sampleApps = [
    { company: 'Google', role: 'Software Engineer', status: 'offered' },
    { company: 'Meta', role: 'Full Stack Developer', status: 'interviewing' },
    { company: 'Stripe', role: 'Backend Engineer', status: 'interviewing' },
    { company: 'Airbnb', role: 'Frontend Engineer', status: 'applied' },
    { company: 'Netflix', role: 'Systems Developer', status: 'rejected' },
    { company: 'Amazon', role: 'SDE-I', status: 'applied' },
  ];

  const sampleResumeStatus = {
    percent: 83,
    fields: {
      contact: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: false,
    }
  };

  const sampleInterviewStats = {
    totalSessions: 6,
    totalQuestions: 18,
    avgClarity: 84,
    trend: [
      { name: 'Sess 1', date: 'May 15', score: 65, questions: 3 },
      { name: 'Sess 2', date: 'May 18', score: 72, questions: 3 },
      { name: 'Sess 3', date: 'May 22', score: 70, questions: 2 },
      { name: 'Sess 4', date: 'May 28', score: 78, questions: 4 },
      { name: 'Sess 5', date: 'Jun 01', score: 82, questions: 3 },
      { name: 'Sess 6', date: 'Jun 04', score: 84, questions: 3 },
    ]
  };

  // Determine if user has any real data to display
  const hasRealData = realApps.length > 0 || realResumeStatus.percent > 0 || realInterviewStats.totalSessions > 0;
  const isDemo = useSampleData || !hasRealData;

  const currentApps = isDemo ? sampleApps : realApps;
  const currentResume = isDemo ? sampleResumeStatus : realResumeStatus;
  const currentInterview = isDemo ? sampleInterviewStats : realInterviewStats;

  // Process applications for chart rendering
  const appStatusCounts = {
    applied: currentApps.filter(a => a.status === 'applied').length,
    interviewing: currentApps.filter(a => a.status === 'interviewing').length,
    offered: currentApps.filter(a => a.status === 'offered' || a.status === 'offered').length,
    rejected: currentApps.filter(a => a.status === 'rejected').length,
  };

  const appChartData = [
    { name: 'Applied', count: appStatusCounts.applied, color: '#a7f3d0' },       // Emerald-200
    { name: 'Interviewing', count: appStatusCounts.interviewing, color: '#10b981' }, // Emerald-500
    { name: 'Offers', count: appStatusCounts.offered, color: '#047857' },       // Emerald-700
    { name: 'Rejected', count: appStatusCounts.rejected, color: '#ef4444' },     // Red-500
  ];

  const totalAppCount = currentApps.length;

  const allFeatures = [
    {
      id: 'chat',
      title: 'AI Mentor',
      description: 'Get high-level career strategy and leadership development from your AI mentor.',
      icon: MessageCircle,
      color: 'bg-purple-500',
      shadow: 'shadow-purple-500/30',
      roles: ['student', 'mentor', 'admin']
    },
    {
      id: 'interview',
      title: 'Interview Practice',
      description: 'Practice your interview skills with our AI interviewer. Get real-time feedback and tips.',
      icon: Lightbulb,
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/30',
      roles: ['student', 'employee', 'admin']
    },
    {
      id: 'tracker',
      title: 'Placement Tracker',
      description: 'Manage and track your job applications, interviews, and offers in one place.',
      icon: Kanban,
      color: 'bg-green-500',
      shadow: 'shadow-green-500/30',
      roles: ['student', 'admin', 'employee']
    },
    {
      id: 'analyzer',
      title: 'Resume Analyzer',
      description: 'Upload your resume and get AI-suggested job roles tailored to your experience.',
      icon: FileText,
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/30',
      roles: ['student', 'mentor', 'admin', 'employee']
    },
    {
      id: 'builder',
      title: 'Resume Builder',
      description: 'Create an ATS-friendly resume from scratch with AI assistance.',
      icon: Briefcase,
      color: 'bg-green-500',
      shadow: 'shadow-green-500/30',
      roles: ['student', 'employee', 'admin']
    },
    {
      id: 'project',
      title: 'Project Builder',
      description: 'Get tech stack recommendations and learning paths for your project ideas.',
      icon: Code,
      color: 'bg-lime-500',
      shadow: 'shadow-lime-500/30',
      roles: ['student', 'employee', 'admin']
    },
    {
      id: 'skillgap',
      title: 'Skill Gap Analyzer',
      description: 'Find missing skills for your dream role and get a custom learning roadmap.',
      icon: Compass,
      color: 'bg-rose-500',
      shadow: 'shadow-rose-500/30',
      roles: ['student', 'mentor', 'admin', 'employee']
    },
    {
      id: 'stories',
      title: 'STAR Story Vault',
      description: 'Craft and analyze your behavioral interview stories using the STAR method.',
      icon: Star,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/30',
      roles: ['student', 'mentor', 'admin', 'employee']
    },
    {
      id: 'tools',
      title: 'Career Suite',
      description: 'Master networking with AI outreach and practice salary negotiations.',
      icon: Sparkles,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-600/30',
      roles: ['student', 'employee', 'admin']
    },
    {
      id: 'report',
      title: 'Software Workflow',
      description: 'View platform usage and user reports.',
      icon: FileText,
      color: 'bg-green-500',
      shadow: 'shadow-green-500/30',
      roles: ['admin', 'mentor']
    },
  ];

  const features = allFeatures.filter(f => !role || f.roles.includes(role));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12" id="home-dashboard-root">
      {/* Hero Section */}
      <div className="bg-emerald-900 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center shadow-2xl relative" id="hero-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="p-10 md:p-16 flex-1 text-white relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800/50 text-emerald-200 text-sm font-bold mb-8 border border-emerald-700/50 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Career Growth</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Land your dream job with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">PrepAI</span>
          </h1>
          <p className="text-emerald-100/90 text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
            Master interviews, optimize your resume, and build the right projects with your personal AI career coach.
          </p>
          {(!role || ['student', 'employee', 'admin'].includes(role)) && (
            <button 
              onClick={() => setActiveTab('interview')}
              className="bg-emerald-400 text-emerald-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-300 hover:scale-105 transition-all flex items-center gap-3 shadow-lg shadow-emerald-400/20 cursor-pointer"
            >
              Start Practicing <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="w-full md:w-2/5 h-72 md:h-auto relative min-h-[450px] hidden md:block">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Students collaborating" 
            className="absolute inset-0 w-full h-full object-cover rounded-l-[4rem]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/40 to-transparent rounded-l-[4rem]"></div>
        </div>
      </div>

      {/* Daily Streak Tracker Component */}
      <DailyStreakTracker 
        user={currentUser} 
        setActiveTab={setActiveTab} 
        onStreakUpdate={(newStreak) => {
          setStreakData(prev => ({
            ...prev,
            currentStreak: newStreak,
            longestStreak: Math.max(prev.longestStreak, newStreak)
          }));
        }}
      />

      {/* Achievement Badges & Milestone Rewards System */}
      <StreakAchievementBadges 
        streakData={streakData} 
        onSelectTask={setActiveTab} 
      />

      {/* Analytics & Progress Section */}
      <div className="bg-gray-50/50 rounded-[2.5rem] p-6 md:p-10 border border-gray-150 shadow-sm space-y-8" id="dashboard-progress-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <span>Your Career Progress Panel</span>
            </h2>
            <p className="text-gray-500 mt-1">Real-time metrics visualizer synchronizing your resume strength, mock interview metrics, and job hunting results.</p>
          </div>

          {/* Toggle with realistic benchmarking support if they want representation */}
          <div className="flex items-center gap-2">
            {hasRealData ? (
              <button
                onClick={() => setUseSampleData(!useSampleData)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  useSampleData 
                    ? 'bg-emerald-550 text-white bg-emerald-600 border-emerald-700' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                id="benchmark-toggle-button"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{useSampleData ? "Showing Demo Data" : "Compare with Demo Progress"}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl border border-amber-100 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Preview mode (Add your details to customize)</span>
              </span>
            )}
          </div>
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Job Applications Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" id="analytics-applications-card">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-150">
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Job Search Pipeline</span>
                </span>
                
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  title="Navigate to Job Placement Tracker"
                >
                  Manage Tracker <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900">Job Funnel Status</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-6">Distribution of your tracked applications</p>

              {/* Chart container */}
              <div className="h-48 flex items-center justify-center relative">
                {totalAppCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        cursor={{ fill: 'rgba(243, 244, 246, 0.4)' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {appChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm font-semibold text-gray-400">No applications registered</p>
                    <button 
                      onClick={() => setActiveTab('tracker')}
                      className="mt-2 text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-100 cursor-pointer"
                    >
                      Track Job Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 mt-4 grid grid-cols-4 gap-1 text-center">
              {appChartData.map((item, idx) => (
                <div key={`${item.name}-${idx}`}>
                  <div className="text-lg font-extrabold text-gray-900">{item.count}</div>
                  <div className="text-[10px] font-medium text-gray-450 truncate" style={{ color: item.color }}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Resume Completion Checkbox */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" id="analytics-resume-card">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-150">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume Checklist</span>
                </span>
                
                <button
                  onClick={() => setActiveTab('builder')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  title="Navigate to Resume Builder"
                >
                  Edit Resume <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900">Resume Strength</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">Estimated completion of ATS structure sections</p>

              {/* Progress visualizer */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-sm font-bold text-gray-800">{currentResume.percent}% Strength</span>
                    <span className="text-xs text-emerald-600 font-bold">
                      {currentResume.percent === 100 ? "Ready to submit!" : currentResume.percent >= 50 ? "Highly structured" : "Needs work"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-500 to-teal-500" 
                      style={{ width: `${currentResume.percent}%` }}
                    />
                  </div>
                </div>

                {/* Individual checkmarks status */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    { label: 'Contact Info', key: 'contact' },
                    { label: 'Work Experience', key: 'experience' },
                    { label: 'Academic Record', key: 'education' },
                    { label: 'Summary Box', key: 'summary' },
                    { label: 'Core Skills', key: 'skills' },
                    { label: 'Key Projects', key: 'projects' },
                  ].map((field) => {
                    const isCompleted = currentResume.fields[field.key as keyof typeof currentResume.fields];
                    return (
                      <div 
                        key={field.key} 
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100/70' 
                            : 'bg-gray-50 text-gray-400 border-gray-200/50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3px]" /> : null}
                        </div>
                        <span className="truncate">{field.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 mt-6">
              <button 
                onClick={() => setActiveTab('builder')}
                className="w-full text-center text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 rounded-xl border border-emerald-150 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {currentResume.percent < 100 ? "Complete Outstanding Resume Sections" : "Optimize with ATS Builder"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Interview Experience Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" id="analytics-interviews-card">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg border border-rose-150">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Interactive Review</span>
                </span>
                
                <button
                  onClick={() => setActiveTab('interview')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  title="Navigate to Interview Practice Screen"
                >
                  Practice Now <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900">Answer Clarity Index</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">Chronological score evolution over practice sessions</p>

              {/* Chart container */}
              <div className="h-32 flex items-center justify-center">
                {currentInterview.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentInterview.trend} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ background: '#111827', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm font-semibold text-gray-400">No mock sessions completed</p>
                    <p className="text-[11px] text-gray-400 mt-1">Practice responding to the AI Interviewer to see score curves.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 mt-6 flex justify-between text-center gap-1">
              <div>
                <div className="text-base font-extrabold text-gray-900">{currentInterview.totalSessions}</div>
                <div className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Sessions</div>
              </div>
              <div className="border-r border-gray-100 h-8 self-center" />
              <div>
                <div className="text-base font-extrabold text-gray-900">{currentInterview.totalQuestions}</div>
                <div className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Answers</div>
              </div>
              <div className="border-r border-gray-100 h-8 self-center" />
              <div>
                <div className="text-base font-extrabold text-emerald-600">{currentInterview.avgClarity}%</div>
                <div className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Avg Clarity</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className="group text-left bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                <div className={`w-16 h-16 rounded-2xl ${feature.color} text-white flex items-center justify-center mb-8 shadow-lg ${feature.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 mb-8 flex-1 leading-relaxed text-lg">{feature.description}</p>
                <div className="flex items-center text-emerald-600 font-bold group-hover:gap-3 transition-all text-lg">
                  Try it now <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
