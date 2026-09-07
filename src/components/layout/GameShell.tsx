import React from 'react'
import { Coins, Volume2, VolumeX, Settings, X, Flame, BookOpen, Store } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CollectionModal } from '../modals/CollectionModal'
import { ShopModal } from '../modals/ShopModal'

interface GameShellProps {
  children: React.ReactNode
}

export const GameShell: React.FC<GameShellProps> = ({ children }) => {
  const {
    coins,
    level,
    soundEnabled,
    toggleSound,
    activeModal,
    setActiveModal,
    soundVolume,
    setSoundVolume,
    musicEnabled,
    toggleMusic,
    musicVolume,
    setMusicVolume,
  } = useAppStore()

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-slate-950 select-none overflow-hidden">
      {/* Desktop Street Cart Background Frame */}
      <div className="absolute inset-0 hidden md:block opacity-20 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Main Game Frame: Mobile-first 390x844 reference, responsive on mobile, bounded on desktop */}
      <div className="relative flex flex-col h-full w-full max-w-[430px] md:max-h-[880px] md:h-[92vh] md:rounded-lg overflow-hidden bg-slate-900 shadow-2xl border-0 md:border md:border-slate-700">
        {/* Top Street-Food Cart Awning Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-red-700 via-amber-200 to-red-700 flex-shrink-0" />

        {/* Top HUD: Inox Header */}
        <header className="flex h-14 w-full items-center justify-between px-2.5 bg-slate-800 border-b border-slate-700 flex-shrink-0 z-20">
          {/* Level / Brand */}
          <div className="flex items-center gap-1.5">
            <div className="flex h-8 items-center gap-1 px-2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Cấp {level}</span>
            </div>
            <span className="font-bold text-xs text-slate-100 tracking-wide hidden min-[360px]:inline">
              Xe Cá Viên
            </span>
          </div>

          {/* Currency / Stats & Action Modals */}
          <div className="flex items-center gap-1.5">
            <div className="flex h-8 items-center gap-1 px-2.5 rounded bg-slate-900 border border-amber-600/50 text-amber-300 font-bold text-xs shadow-inner">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>{coins.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Collection Trigger */}
            <button
              onClick={() => setActiveModal('collection')}
              aria-label="Thực đơn bộ sưu tập"
              title="Thực Đơn"
              className="btn-inox h-8 w-8 !p-0"
            >
              <BookOpen className="h-4 w-4 text-slate-700" />
            </button>

            {/* Shop Trigger */}
            <button
              onClick={() => setActiveModal('shop')}
              aria-label="Cửa hàng món mới"
              title="Mua Món Mới"
              className="btn-inox h-8 w-8 !p-0"
            >
              <Store className="h-4 w-4 text-slate-700" />
            </button>

            {/* Audio Toggle (Quick Mute) */}
            <button
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="btn-inox h-8 w-8 !p-0"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-slate-700" />
              ) : (
                <VolumeX className="h-4 w-4 text-red-600" />
              )}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setActiveModal('settings')}
              aria-label="Cài đặt trò chơi"
              className="btn-inox h-8 w-8 !p-0"
            >
              <Settings className="h-4 w-4 text-slate-700" />
            </button>
          </div>
        </header>

        {/* Phaser Game Container viewport */}
        <main className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 touch-none">
          {children}
        </main>

        {/* Bottom Cart Base Trim */}
        <footer className="h-4 w-full bg-slate-800 border-t border-slate-700 flex items-center justify-between px-3 text-[10px] text-slate-400 flex-shrink-0">
          <span>v0.1.0 • Chuẩn vỉa hè Sài Gòn</span>
          <span>Bản quyền © Xe Cá Viên</span>
        </footer>

        {/* Settings Modal */}
        {activeModal === 'settings' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
            <div className="surface-board w-full max-w-xs p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-400" />
                  Cài Đặt Xe
                </h3>
                <button
                  onClick={() => setActiveModal('none')}
                  className="text-slate-400 hover:text-slate-200"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sound volume slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Hiệu ứng âm thanh (SFX)</span>
                  <span>{soundEnabled ? `${Math.round(soundVolume * 100)}%` : 'Tắt'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleSound} className="btn-inox h-7 w-7 !p-0">
                    {soundEnabled ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundEnabled ? soundVolume : 0}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    disabled={!soundEnabled}
                    className="flex-1 accent-amber-500"
                  />
                </div>
              </div>

              {/* Music volume slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Nhạc nền vỉa hè</span>
                  <span>{musicEnabled ? `${Math.round(musicVolume * 100)}%` : 'Tắt'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMusic} className="btn-inox h-7 w-7 !p-0">
                    {musicEnabled ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicEnabled ? musicVolume : 0}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    disabled={!musicEnabled}
                    className="flex-1 accent-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-end">
                <button onClick={() => setActiveModal('none')} className="btn-inox w-full">
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collection / Food Menu Modal */}
        {activeModal === 'collection' && <CollectionModal onClose={() => setActiveModal('none')} />}

        {/* Shop Modal */}
        {activeModal === 'shop' && <ShopModal onClose={() => setActiveModal('none')} />}
      </div>
    </div>
  )
}
