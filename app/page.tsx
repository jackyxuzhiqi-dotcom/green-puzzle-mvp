'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [unlocked, setUnlocked] = useState<number[]>([])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return

    // 找出还没解锁的块
    const remaining = Array.from({ length: 9 })
      .map((_, i) => i)
      .filter((i) => !unlocked.includes(i))

    if (remaining.length === 0) return

    // 随机选一个
    const randomIndex =
      remaining[Math.floor(Math.random() * remaining.length)]

    setUnlocked([...unlocked, randomIndex])
    setEmail('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">

        {/* 标题 */}
        <h1 className="text-2xl font-semibold mb-3">
          Green Puzzle MVP
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Unlock random puzzle pieces 🌱
        </p>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-xl border px-4 py-3"
          >
            Continue
          </button>

          {/* 邮箱说明 + 规则 */}
          <p className="text-xs text-gray-500">
            Enter your email to save your progress and receive rewards 🎁.  
            We don’t send spam.  
            You can unlock up to one puzzle piece per day.
          </p>
        </form>

        {/* 拼图 */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const isUnlocked = unlocked.includes(i)

            return (
              <div
                key={i}
                className="h-24 rounded overflow-hidden border relative"
                style={{
                  backgroundImage: `url('/puzzle.jpg')`,
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${col * 50}% ${row * 50}%`,
                }}
              >
                {/* 未解锁 → 深绿色渐变遮罩 */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 opacity-95 transition-all duration-300" />
                )}
              </div>
            )
          })}
        </div>

        {/* 进度 */}
        <p className="mt-4 text-sm">
          Progress: {unlocked.length} / 9
        </p>

      </div>
    </main>
  )
}