import React, { useState } from 'react'
import { X, Store, Coins, Clock, Lock, CheckCircle } from 'lucide-react'
import { FULL_FOOD_CATALOG, getUnlockCost } from '@/game/data/catalog'
import { useAppStore } from '@/store/useAppStore'

interface ShopModalProps {
  onClose: () => void
}

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const { coins, unlockedFoods, unlockFood } = useAppStore()
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const lockedFoods = FULL_FOOD_CATALOG.filter((f) => !unlockedFoods.includes(f.id))

  const handleUnlock = async (foodId: string, cost: number) => {
    if (coins < cost) {
      setMessage(`Bạn còn thiếu ${(cost - coins).toLocaleString('vi-VN')} đ để mở khóa món này!`)
      return
    }

    setPurchasingId(foodId)
    setMessage(null)

    const result = await unlockFood(foodId)
    setPurchasingId(null)

    if (result.success) {
      setMessage(`🎉 Mở khóa thành công món mới! Hãy thả vào chảo để chiên phục vụ khách.`)
    } else {
      setMessage(`❌ ${result.message || 'Không thể mở khóa món'}`)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-3 animate-in fade-in">
      <div className="surface-board flex flex-col h-[90%] max-h-[720px] w-full max-w-sm rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Chợ Đầu Mối Vỉa Hè
              </h2>
              <p className="text-[11px] text-slate-400">
                Ví của bạn:{' '}
                <span className="text-amber-300 font-bold">{coins.toLocaleString('vi-VN')} đ</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status / feedback banner */}
        {message && (
          <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-800/80 text-amber-300 text-xs font-medium">
            {message}
          </div>
        )}

        {/* Locked Food List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {lockedFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
              <p className="text-sm font-bold text-slate-200">
                Chúc mừng! Bạn đã mở khóa toàn bộ 60 món ăn!
              </p>
              <p className="text-xs">Xe cá viên của bạn là đệ nhất ẩm thực đường phố.</p>
            </div>
          ) : (
            lockedFoods.map((food) => {
              const cost = getUnlockCost(food)
              const canAfford = coins >= cost
              const isBuying = purchasingId === food.id

              return (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-3 rounded bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-slate-900 border border-slate-700 text-slate-400">
                      <Lock className="h-5 w-5 text-amber-500" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{food.displayNameVi}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {food.cookTimeMs / 1000}s
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400">
                          Bán: {food.basePrice.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleUnlock(food.id, cost)}
                    disabled={!canAfford || isBuying}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm ${
                      canAfford
                        ? 'btn-street-red'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-300" />
                    <span>{isBuying ? 'Đang mở...' : `${cost.toLocaleString('vi-VN')} đ`}</span>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-inox w-full text-xs">
            Trở Về Quán
          </button>
        </div>
      </div>
    </div>
  )
}
