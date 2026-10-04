import { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Zap, 
  Crown, 
  Gem, 
  Award, 
  ChevronRight, 
  X, 
  Flame, 
  Star, 
  ShieldCheck, 
  Gift 
} from 'lucide-react';
import { 
  AchievementBadge, 
  STREAK_ACHIEVEMENT_BADGES, 
  getBadgeStatus, 
  StreakState 
} from '../lib/streak';

interface StreakAchievementBadgesProps {
  streakData: StreakState;
  onSelectTask?: (tab: string) => void;
}

export function StreakAchievementBadges({ streakData, onSelectTask }: StreakAchievementBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [filter, setFilter] = useState<'all' | 'key' | 'unlocked'>('all');

  const highestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);

  // Focus specifically on the 7, 30, and 100-day milestone badges as highlighted achievements
  const keyBadges = STREAK_ACHIEVEMENT_BADGES.filter(b => [7, 30, 100].includes(b.daysRequired));
  
  const displayedBadges = STREAK_ACHIEVEMENT_BADGES.filter(badge => {
    if (filter === 'key') return [7, 30, 100].includes(badge.daysRequired);
    if (filter === 'unlocked') return highestStreak >= badge.daysRequired;
    return true;
  });

  const unlockedCount = STREAK_ACHIEVEMENT_BADGES.filter(b => highestStreak >= b.daysRequired).length;
  const totalXPUnlocked = STREAK_ACHIEVEMENT_BADGES
    .filter(b => highestStreak >= b.daysRequired)
    .reduce((sum, b) => sum + b.xpReward, 0);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6" id="streak-rewards-system">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                Streak Achievement Badges
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Rewards Unlocked
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Maintain your daily prep to unlock exclusive 7-day, 30-day, and 100-day milestone crests.
            </p>
          </div>
        </div>

        {/* Global Rewards Stats & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>+{totalXPUnlocked} XP Earned</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({STREAK_ACHIEVEMENT_BADGES.length})
            </button>
            <button
              onClick={() => setFilter('key')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'key' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Key Tiers (7, 30, 100d)
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'unlocked' 
                  ? 'bg-white text-amber-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Featured Focus Tier: 7, 30, and 100-Day Badges Showcase */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Core Milestone Tiers (7, 30 & 100 Days)</span>
          </h4>
          <span className="text-xs text-gray-400 font-medium">
            Active Streak: <strong className="text-gray-900">{streakData.currentStreak} Days</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {keyBadges.map((badge) => {
            const status = getBadgeStatus(badge, streakData.currentStreak, streakData.longestStreak);
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden ${
                  status.isUnlocked
                    ? `bg-gradient-to-b from-white to-gray-50/80 ${badge.borderGlow} hover:-translate-y-1 hover:shadow-xl`
                    : 'bg-gray-50/60 border-gray-200/80 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* Background ambient glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 ${badge.bgGlow}`} />

                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md transition-transform duration-300 group-hover:scale-110 ${
                      status.isUnlocked
                        ? `bg-gradient-to-tr ${badge.gradient} text-white shadow-lg`
                        : 'bg-gray-200/80 text-gray-400 grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    <div>
                      {status.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-200 text-gray-600">
                          <Lock className="w-3 h-3 text-gray-500" />
                          {status.daysLeft}d left
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-extrabold text-amber-600">
                      {badge.daysRequired}-Day Streak
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      +{badge.xpReward} XP
                    </span>
                  </div>

                  <h5 className="text-base font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {badge.name}
                  </h5>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {badge.rewardDescription}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-gray-500">Streak Progress</span>
                    <span className={status.isUnlocked ? "text-emerald-600" : "text-gray-700"}>
                      {status.highestStreak}/{badge.daysRequired} Days ({status.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        status.isUnlocked 
                          ? `bg-gradient-to-r ${badge.gradient}` 
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${status.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Available Streak Badges Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Complete Badges Ladder</span>
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayedBadges.map((badge) => {
            const status = getBadgeStatus(badge, streakData.currentStreak, streakData.longestStreak);
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer group flex flex-col justify-between items-center ${
                  status.isUnlocked
                    ? 'bg-white border-emerald-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5'
                    : 'bg-gray-50/50 border-gray-200/60 opacity-85 hover:opacity-100 hover:bg-gray-50'
                }`}
              >
                <div className="relative mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm ${
                    status.isUnlocked
                      ? `bg-gradient-to-tr ${badge.gradient} text-white`
                      : 'bg-gray-200 text-gray-400 grayscale'
                  }`}>
                    {badge.icon}
                  </div>
                  {status.isUnlocked ? (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center shadow">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <span className="text-[10px] font-black uppercase text-amber-600 block truncate">
                    {badge.daysRequired} Days
                  </span>
                  <h6 className="text-xs font-bold text-gray-900 truncate mt-0.5">
                    {badge.name}
                  </h6>
                  <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                    +{badge.xpReward} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Details Inspection Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-scaleUp">
            {/* Background Aura */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${selectedBadge.bgGlow}`} />

            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const status = getBadgeStatus(selectedBadge, streakData.currentStreak, streakData.longestStreak);
              return (
                <div className="relative z-10 text-center space-y-5">
                  {/* Icon Emblem */}
                  <div className="flex justify-center">
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl shadow-xl ${
                      status.isUnlocked
                        ? `bg-gradient-to-tr ${selectedBadge.gradient} text-white shadow-lg ring-4 ring-emerald-400/20 animate-bounce`
                        : 'bg-gray-150 text-gray-400 border border-gray-200 grayscale'
                    }`}>
                      {selectedBadge.icon}
                    </div>
                  </div>

                  {/* Title & Tier */}
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

                  {/* Rewards Breakdown Box */}
                  <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-150 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>Reward & Privilege Details</span>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Milestone Requirement:</span>
                        <span className="font-bold text-gray-900">{selectedBadge.daysRequired} Consecutive Days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">XP Bonus:</span>
                        <span className="font-bold text-emerald-600">+{selectedBadge.xpReward} XP</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-gray-200/60">
                        <span className="text-gray-500 shrink-0">Unlocked Perk:</span>
                        <span className="font-semibold text-gray-900 text-right">{selectedBadge.perk}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-1">
                    {status.isUnlocked ? (
                      <div className="bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Achievement Unlocked & Active!</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-500">Progress to Unlock</span>
                          <span className="text-amber-700">{status.highestStreak}/{selectedBadge.daysRequired} Days ({status.daysLeft} days remaining)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${status.progressPercent}%` }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBadge(null);
                            onSelectTask?.('interview');
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 fill-current" />
                          <span>Practice Prep Tasks Today</span>
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
