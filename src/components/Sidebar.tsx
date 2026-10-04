import { Briefcase, FileText, LayoutDashboard, MessageSquare, Code, LogOut, User as UserIcon, MessageCircle, Sparkles, Kanban, Star, Compass, Lightbulb, Key, Flame } from 'lucide-react';
import { User } from 'firebase/auth';
import { logout } from '../lib/firebase';
import { useState, useEffect } from 'react';
import { ApiSettingsModal } from './ApiSettingsModal';
import { getStreakData } from '../lib/streak';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  role: string | null;
}

export function Sidebar({ activeTab, setActiveTab, user, role }: SidebarProps) {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState<number>(0);

  useEffect(() => {
    getStreakData(user).then((data) => {
      setStreakCount(data.currentStreak);
    }).catch(() => {});
  }, [user, activeTab]);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'mentor', 'admin', 'employee'] },
    { id: 'chat', label: 'AI Mentor', icon: MessageCircle, roles: ['student', 'mentor', 'admin'] },
    { id: 'skillgap', label: 'Skill Gap Analyzer', icon: Compass, roles: ['student', 'mentor', 'admin', 'employee'] },
    { id: 'stories', label: 'STAR Story Vault', icon: Star, roles: ['student', 'mentor', 'admin', 'employee'] },
    { id: 'interview', label: 'Interview Practice', icon: Lightbulb, roles: ['student', 'employee', 'admin'] },
    { id: 'tracker', label: 'Placement Tracker', icon: Kanban, roles: ['student', 'admin', 'employee'] },
    { id: 'analyzer', label: 'Resume Analyzer', icon: FileText, roles: ['student', 'mentor', 'admin', 'employee'] },
    { id: 'builder', label: 'Resume Builder', icon: Briefcase, roles: ['student', 'employee', 'admin'] },
    { id: 'project', label: 'Project Builder', icon: Code, roles: ['student', 'employee', 'admin'] },
    { id: 'tools', label: 'Career Suite', icon: Sparkles, roles: ['student', 'employee', 'admin'] },
    { id: 'report', label: 'Software Workflow', icon: FileText, roles: ['admin', 'mentor'] },
    { id: 'profile', label: 'My Profile', icon: UserIcon, roles: ['student', 'mentor', 'admin', 'employee'] },
  ];

  const filteredNavItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            PrepAI
          </h1>
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all ${
              streakCount > 0 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/20' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
            title="Daily Prep Streak"
          >
            <Flame className={`w-3.5 h-3.5 ${streakCount > 0 ? 'fill-white text-white' : 'text-emerald-500'}`} />
            <span>{streakCount}d</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Student Placement & Training</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 space-y-4">
        {user && (
          <button 
            onClick={() => setActiveTab('profile')}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-emerald-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  role === 'admin' ? 'bg-red-100 text-red-700' : 
                  role === 'mentor' ? 'bg-blue-100 text-blue-700' : 
                  role === 'employee' ? 'bg-teal-100 text-teal-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {role || 'student'}
                </span>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </button>
        )}
        
        <button 
          onClick={() => setIsApiModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors font-medium border border-emerald-100"
        >
          <Key className="w-5 h-5 text-emerald-500" />
          API Configuration
        </button>

        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
      
      <ApiSettingsModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
    </aside>
  );
}
