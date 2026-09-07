import React, { useState } from 'react'
import {
  X,
  Wrench,
  Flame,
  Clock,
  ChefHat,
  Utensils,
  Layers,
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CART_UPGRADES, getNextUpgradeTier, getUpgradeTier } from '@/game/data/upgrades'

interface UpgradesModalProps {
  onClose: () => void
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({ onClose }) => {
  const { coins, level, upgrades, purchaseUpgrade } = useAppStore()
  const [upgradingKey, setUpgradingKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    key: string
    message: string
    isError: boolean
  } | null>(null)

  const handlePurchase = async (upgradeKey: string) => {
    setUpgradingKey(upgradeKey)
    setFeedback(null)

    const res = await purchaseUpgrade(upgradeKey)
    setUpgradingKey(null)

    if (res.success) {
      setFeedback({
        key: upgradeKey,
        message: 'Nâng cấp thành công!',
        isError: false,
      })
    } else {
      setFeedback({
        key: upgradeKey,
        message: res.message || 'Không thể nâng cấp',
        isError: true,
      })
    }

    setTimeout(() => {
      setFeedback(null)
    }, 2500)
  }

  const getUpgradeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="h-5 w-5 text-amber-500" />
      case 'Clock':
        return <Clock className="h-5 w-5 text-sky-400" />
      case 'ChefHat':
        return <ChefHat className="h-5 w-5 text-emerald-400" />
      case 'Utensils':
        return <Utensils className="h-5 w-5 text-orange-400" />
      case 'Layers':
        return <Layers className="h-5 w-5 text-purple-400" />
      default:
        return <Wrench className="h-5 w-5 text-amber-400" />
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-in fade-in">
      <div className="surface-board flex flex-col w-full max-w-md max-h-[90%] p-4 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-600/20 text-amber-400 border border-amber-500/40">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Nâng Cấp Xe Cá Viên
              </h3>
              <p className="text-[11px] text-slate-400">Trang bị thêm đồ nghề vỉa hè tiện lợi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-bold text-xs">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>{coins.toLocaleString('vi-VN')} đ</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 scrollbar-thin">
          {CART_UPGRADES.map((upgrade) => {
            const currentTier = upgrades[upgrade.id] ?? 1
            const maxTier = upgrade.tiers[upgrade.tiers.length - 1].tier
            const currentConfig = getUpgradeTier(upgrade.id, currentTier)
            const nextConfig = getNextUpgradeTier(upgrade.id, currentTier)
            const isMax = currentTier >= maxTier
            const canAfford = nextConfig ? coins >= nextConfig.cost : false
            const levelMet = nextConfig ? level >= nextConfig.levelRequired : true
            const isUpgrading = upgradingKey === upgrade.id
            const itemFeedback = feedback?.key === upgrade.id ? feedback : null

            return (
              <div
                key={upgrade.id}
                className="rounded-lg bg-slate-900/90 border border-slate-700 p-3 flex flex-col gap-2.5 transition-all"
              >
                {/* Upgrade Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-800 border border-slate-700 flex-shrink-0">
                      {getUpgradeIcon(upgrade.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-100">{upgrade.nameVi}</h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                          Cấp {currentTier}/{maxTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {upgrade.shortDescVi}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current vs Next Tier Effects */}
                <div className="rounded bg-slate-950/60 p-2 text-[11px] space-y-1 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Hiện tại:</span>
                    <span className="font-medium text-amber-300/90">
                      {currentConfig.descriptionVi}
                    </span>
                  </div>
                  {nextConfig && (
                    <div className="flex items-center justify-between text-emerald-300 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Cấp kế ({nextConfig.tier}):</span>
                      <span className="font-medium text-emerald-400">
                        {nextConfig.descriptionVi}
                      </span>
                    </div>
                  )}
                </div>

                {/* Feedback message if any */}
                {itemFeedback && (
                  <div
                    className={`text-[11px] px-2 py-1 rounded text-center font-medium ${
                      itemFeedback.isError
                        ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                    }`}
                  >
                    {itemFeedback.message}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                  {isMax ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã đạt cấp tối đa</span>
                    </div>
                  ) : !levelMet ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-500/90 font-medium">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Yêu cầu Cấp {nextConfig?.levelRequired}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(upgrade.id)}
                      disabled={!canAfford || isUpgrading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm ${
                        canAfford && !isUpgrading
                          ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95 border border-amber-500/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5 text-amber-300" />
                      <span>
                        {isUpgrading
                          ? 'Đang nâng cấp...'
                          : `Nâng Cấp (${nextConfig?.cost.toLocaleString('vi-VN')} đ)`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-inox w-full text-xs font-bold py-2">
            Đóng bảng nâng cấp
          </button>
        </div>
      </div>
    </div>
  )
}
