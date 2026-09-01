import React, { useState, useEffect, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { auth, db, signInWithGoogle, logout, checkRedirectResult } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const InterviewPractice = React.lazy(() => import('./components/InterviewPractice').then(m => ({ default: m.InterviewPractice })));
const ResumeAnalyzer = React.lazy(() => import('./components/ResumeAnalyzer').then(m => ({ default: m.ResumeAnalyzer })));
const ResumeBuilder = React.lazy(() => import('./components/ResumeBuilder').then(m => ({ default: m.ResumeBuilder })));
const ProjectBuilder = React.lazy(() => import('./components/ProjectBuilder').then(m => ({ default: m.ProjectBuilder })));
const Report = React.lazy(() => import('./components/Report').then(m => ({ default: m.Report })));
const GeminiChat = React.lazy(() => import('./components/GeminiChat').then(m => ({ default: m.GeminiChat })));
const StoryVault = React.lazy(() => import('./components/StoryVault').then(m => ({ default: m.StoryVault })));
const SkillGapAnalyzer = React.lazy(() => import('./components/SkillGapAnalyzer').then(m => ({ default: m.SkillGapAnalyzer })));
const CareerTools = React.lazy(() => import('./components/CareerTools').then(m => ({ default: m.CareerTools })));
const JobTracker = React.lazy(() => import('./components/JobTracker').then(m => ({ default: m.JobTracker })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we are returning from a redirect sign in
    checkRedirectResult().catch(err => {
      console.error("Redirect auth error:", err);
      // We don't necessarily want to block the app, just log it.
    });

    let unsubDoc: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      // Clean up previous snapshot listener if it exists
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = undefined;
      }

      if (user) {
        setLoading(false); // Make app load faster immediately
        const userDocRef = doc(db, 'users', user.uid);
        unsubDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setRole(doc.data().role);
            setSubscriptionStatus(doc.data().subscriptionStatus || 'inactive');
          } else {
            setRole('student');
            setSubscriptionStatus('inactive');
          }
        }, (error) => {
          console.error("Error fetching user role:", error);
          setRole('student'); // Fallback on error
          setSubscriptionStatus('inactive');
        });
      } else {
        setRole(null);
        setSubscriptionStatus(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const handleSignIn = async (preferredRole: 'student' | 'employee' | 'mentor' | 'admin' = 'student') => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    setAuthError(null);
    
    try {
      await signInWithGoogle(preferredRole);
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by your browser. Please click the 'Open App' icon (a square with an arrow) in the top right of this preview to open the app in a new tab, or allow popups for this site in your browser settings.");
      } else {
        setAuthError(error.message || "An unexpected error occurred during sign in.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
        <p className="text-emerald-800 font-medium animate-pulse">Initializing PrepAI...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView isSigningIn={isSigningIn} authError={authError} handleSignIn={handleSignIn} />;
  }

  const isOwner = user?.email === 'engineeringstudies5@gmail.com';

  const navItemRoles: Record<string, string[]> = {
    home: ['student', 'mentor', 'admin', 'employee'],
    chat: ['student', 'mentor', 'admin'],
    skillgap: ['student', 'mentor', 'admin', 'employee'],
    stories: ['student', 'mentor', 'admin', 'employee'],
    interview: ['student', 'employee', 'admin'],
    tracker: ['student', 'admin', 'employee'],
    analyzer: ['student', 'mentor', 'admin', 'employee'],
    builder: ['student', 'employee', 'admin'],
    project: ['student', 'employee', 'admin'],
    tools: ['student', 'employee', 'admin'],
    report: ['admin', 'mentor'],
    profile: ['student', 'mentor', 'admin', 'employee']
  };

  const roleValue = role || 'student';
  const currentTabAllowed = navItemRoles[activeTab]?.includes(roleValue);

  if (!currentTabAllowed) {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} role={role} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
          <div className="text-center p-12 bg-white rounded-3xl border border-red-100 shadow-sm max-w-lg">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-500 mb-8">You don't have permission to view this section with your current role ({roleValue}).</p>
            <button 
              onClick={() => setActiveTab('home')}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Return Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} role={role} />
        <main className="flex-1 overflow-y-auto flex flex-col relative">
          <div className="p-8 flex-1">
            <Suspense fallback={
              <div className="h-full w-full flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-emerald-800 font-medium animate-pulse">Loading module...</p>
              </div>
            }>
              {activeTab === 'home' && <Home setActiveTab={setActiveTab} role={role} />}
              {activeTab === 'chat' && <GeminiChat />}
              {activeTab === 'skillgap' && <SkillGapAnalyzer />}
              {activeTab === 'stories' && <StoryVault />}
              {activeTab === 'interview' && <InterviewPractice />}
              {activeTab === 'tracker' && <JobTracker />}
              {activeTab === 'analyzer' && <ResumeAnalyzer />}
              {activeTab === 'builder' && <ResumeBuilder />}
              {activeTab === 'project' && <ProjectBuilder />}
              {activeTab === 'tools' && <CareerTools />}
              {activeTab === 'report' && <Report />}
              {activeTab === 'profile' && <UserProfile />}
            </Suspense>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
