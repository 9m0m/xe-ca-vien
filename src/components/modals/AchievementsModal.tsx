import React from 'react'
import { X, Trophy, Award, Sparkles, ShoppingBag, Flame, Coins, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ACHIEVEMENTS, getAchievementProgress } from '@/game/data/achievements'

interface AchievementsModalProps {
  onClose: () => void
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { coins, stats, unlockedAchievements, claimedAchievements, claimAchievement } =
    useAppStore()

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-in fade-in">
      <div className="surface-board flex flex-col w-full max-w-md max-h-[90%] p-4 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Thành Tựu & Kỷ Lục
              </h3>
              <p className="text-[11px] text-slate-400">Hành trình làm chủ xe cá viên vỉa hè</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Street Vendor Stats Overview Card */}
        <div className="my-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-3 gap-2 text-center flex-shrink-0">
          <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-sky-400 mb-0.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Đơn Hàng</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {stats.ordersServed.toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
              <Flame className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Xiên Vàng</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {stats.perfectItemsFried.toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Doanh Thu</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {stats.totalCoinsEarned.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id)
            const progress = getAchievementProgress(achievement, stats, coins)

            return (
              <div
                key={achievement.id}
                className={`rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                  isUnlocked
                    ? 'bg-amber-950/20 border-amber-500/40 text-slate-100'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded flex-shrink-0 ${
                        isUnlocked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isUnlocked ? (
                        <Award className="h-4 w-4" />
                      ) : (
                        <Trophy className="h-4 w-4 opacity-50" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold">{achievement.titleVi}</h4>
                        {isUnlocked && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã Đạt
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {achievement.descriptionVi}
                      </p>
                    </div>
                  </div>

                  {/* Reward badge / Claim button */}
                  {isUnlocked ? (
                    claimedAchievements.includes(achievement.id) ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300 font-bold flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Đã nhận</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => claimAchievement(achievement.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 active:scale-95 text-[10px] text-white font-bold shadow-sm transition-all flex-shrink-0 border border-amber-400/50"
                      >
                        <Sparkles className="h-3 w-3 text-amber-200" />
                        <span>Nhận +{achievement.rewardCoins.toLocaleString('vi-VN')} đ</span>
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-amber-300 font-bold flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>+{achievement.rewardCoins.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Tiến độ</span>
                    <span>
                      {isUnlocked
                        ? `${achievement.targetValue}/${achievement.targetValue}`
                        : `${progress.current.toLocaleString('vi-VN')}/${achievement.targetValue.toLocaleString('vi-VN')}`}{' '}
                      ({progress.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isUnlocked ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${isUnlocked ? 100 : progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-inox w-full text-xs font-bold py-2">
            Đóng bảng thành tựu
          </button>
        </div>
      </div>
    </div>
  )
}
