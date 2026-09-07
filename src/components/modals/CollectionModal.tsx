import React, { useState } from 'react'
import { X, BookOpen, Clock, Coins, Flame, CheckCircle, Lock } from 'lucide-react'
import { FULL_FOOD_CATALOG } from '@/game/data/catalog'
import { useAppStore } from '@/store/useAppStore'
import { FoodCategory } from '@/game/types'

interface CollectionModalProps {
  onClose: () => void
}

const CATEGORY_TABS: { id: string; label: string; cat?: FoodCategory }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'vien', label: 'Cá & Bò Viên', cat: 'vien' },
  { id: 'tofu_cake', label: 'Đậu Hũ & Chả', cat: 'tofu_cake' },
  { id: 'sausage', label: 'Xúc Xích & Thịt', cat: 'sausage' },
  { id: 'surimi', label: 'Surimi Hải Sản', cat: 'surimi' },
  { id: 'dumpling', label: 'Há Cảo & Bánh', cat: 'dumpling' },
  { id: 'cheese_crispy', label: 'Phô Mai & Món Giòn', cat: 'cheese_crispy' },
]

export const CollectionModal: React.FC<CollectionModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('all')
  const { unlockedFoods } = useAppStore()

  const filteredFoods = FULL_FOOD_CATALOG.filter((food) => {
    if (activeTab === 'all') return true
    return food.category === activeTab
  })

  const unlockedCount = FULL_FOOD_CATALOG.filter((f) => unlockedFoods.includes(f.id)).length

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-3 animate-in fade-in">
      <div className="surface-board flex flex-col h-[90%] max-h-[720px] w-full max-w-sm rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Thực Đơn Xe Cá Viên
              </h2>
              <p className="text-[11px] text-amber-300">
                Đã sưu tập: {unlockedCount} / {FULL_FOOD_CATALOG.length} món
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

        {/* Category Horizontal Tab Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 border-b border-slate-800 overflow-x-auto no-scrollbar flex-shrink-0">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Food List Grid */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredFoods.map((food) => {
            const isUnlocked = unlockedFoods.includes(food.id)

            return (
              <div
                key={food.id}
                className={`flex items-center justify-between p-2.5 rounded border transition-all ${
                  isUnlocked
                    ? 'bg-slate-800/90 border-slate-600 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Indicator / Avatar */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded border ${
                      isUnlocked
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? <Flame className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-100">{food.displayNameVi}</h4>
                      {isUnlocked && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {food.cookTimeMs / 1000}s chiên
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Coins className="h-3 w-3 text-amber-400" />
                        {food.basePrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier indicator */}
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isUnlocked ? 'Sẵn sàng' : `Cấp ${food.unlockTier}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-inox w-full text-xs">
            Đóng Thực Đơn
          </button>
        </div>
      </div>
    </div>
  )
}
