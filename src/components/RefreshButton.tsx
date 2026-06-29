'use client'

import { useTransition } from 'react'
import { revalidateHome } from '@/app/actions'

export function RefreshButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => revalidateHome())}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      title="キャッシュをクリアして最新情報に更新"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={isPending ? 'animate-spin' : ''}
      >
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
      {isPending ? '更新中...' : '更新'}
    </button>
  )
}
