import React from 'react'
import { Utensils } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Đang chuẩn bị xe cá viên...',
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-street-bg p-6 text-slate-100">
      <div className="surface-board flex flex-col items-center gap-5 p-8 text-center shadow-2xl max-w-xs w-full">
        {/* Pan icon with subtle pulse */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
          <Utensils className="h-8 w-8 text-amber-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-wide text-amber-400 uppercase">Xe Cá Viên</h1>
          <p className="mt-1 text-xs text-slate-400">Tiệm Cá Viên Chiên Vỉa Hè</p>
        </div>

        {/* Street food fry status bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>

        <p className="text-sm font-medium text-slate-300">{message}</p>
      </div>
    </div>
  )
}
