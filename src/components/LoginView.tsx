import { Loader2, Briefcase, Sparkles, ShieldCheck, Globe, Zap } from 'lucide-react';

interface LoginViewProps {
  isSigningIn: boolean;
  authError: string | null;
  handleSignIn: (role?: 'student' | 'employee' | 'mentor' | 'admin') => void;
}

export function LoginView({ isSigningIn, authError, handleSignIn }: LoginViewProps) {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col md:flex-row">
      {/* Left Side - Branding & Info */}
      <div className="flex-1 bg-emerald-900 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/20">
              <Briefcase className="w-7 h-7 text-emerald-950" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">PrepAI</h1>
          </div>
          
          <div className="max-w-lg">
            <h2 className="text-5xl font-extrabold mb-8 leading-tight">
              The future of <span className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-8">career prep</span> is here.
            </h2>
            <p className="text-emerald-100/80 text-xl leading-relaxed mb-12">
              Join thousands of students using AI to master interviews, build perfect resumes, and launch successful engineering careers.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">AI Interview Coach</h4>
                  <p className="text-emerald-200/60">Real-time feedback on your speaking and content.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">ATS-Optimized Resumes</h4>
                  <p className="text-emerald-200/60">Pass the filters with AI-crafted professional documents.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 pt-12 border-t border-emerald-800/50 flex items-center gap-8 text-emerald-400/60 text-sm font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Access</div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Instant Feedback</div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-[450px] bg-white p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm text-center">
          <h3 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h3>
          <p className="text-gray-500 mb-10">Sign in to continue your journey</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleSignIn('student')}
              disabled={isSigningIn}
              className="w-full relative overflow-hidden flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-600 border-2 border-transparent py-4 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <style>{`
                @keyframes shimmer {
                  100% { transform: translateX(100%); }
                }
              `}</style>
              {isSigningIn ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <div className="bg-white p-1 rounded-full bg-opacity-90">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 block" />
                </div>
              )}
              <span className="relative z-10">{isSigningIn ? 'Signing in...' : 'Login as Engineering Grad'}</span>
            </button>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex flex-col gap-2 mt-4">
              <p>{authError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs underline hover:text-red-800 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-400 px-8 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
