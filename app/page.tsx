'use client'

import { useMemo, useState } from 'react'

type UserProgress = {
  unlocked: number[]
  todayCount: number
  lastDate: string
}

type ProgressMap = Record<string, UserProgress>

export default function Home() {
  const [email, setEmail] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [message, setMessage] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const currentData = useMemo(() => {
    if (!currentEmail) return null
    return progressMap[currentEmail]
  }, [currentEmail, progressMap])

  const currentUnlocked = currentData?.unlocked || []

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    let userData = progressMap[normalizedEmail]

    // 初始化
    if (!userData) {
      userData = {
        unlocked: [],
        todayCount: 0,
        lastDate: today,
      }
    }

    // 如果是新的一天 → 重置计数
    if (userData.lastDate !== today) {
      userData.todayCount = 0
      userData.lastDate = today
    }

    // 🚫 限制：每天最多2块
    if (userData.todayCount >= 2) {
      setMessage('You have reached today’s limit (2 pieces). Come back tomorrow 🌱')
      setCurrentEmail(normalizedEmail)
      setEmail('')
      return
    }

    const remaining = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !userData.unlocked.includes(i)
    )

    if (remaining.length === 0) {
      setMessage('Puzzle completed 🎉')
      setCurrentEmail(normalizedEmail)
      setEmail('')
      return
    }

    const randomIndex =
      remaining[Math.floor(Math.random() * remaining.length)]

    userData.unlocked.push(randomIndex)
    userData.todayCount += 1

    setProgressMap((prev) => ({
      ...prev,
      [normalizedEmail]: { ...userData },
    }))

    setCurrentEmail(normalizedEmail)
    setMessage('')
    setEmail('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md rounded-[2rem] border-2 p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold mb-3">
          Green Puzzle
        </h1>

        <p className="text-center text-sm text-gray-600 mb-6">
          Unlock random puzzle pieces 🌱
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg outline-none"
          />

          <p className="text-xs text-gray-500">
            Enter your email to save your progress and receive rewards 🎁
          </p>

          <button
            type="submit"
            className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
          >
            Continue
          </button>
        </form>

        {/* 拼图 */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const isUnlocked = currentUnlocked.includes(i)

            return (
              <div
                key={i}
                className="h-24 rounded-xl overflow-hidden border-2 relative"
                style={{
                  backgroundImage: `url('/puzzle.jpg')`,
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${col * 50}% ${row * 50}%`,
                }}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 opacity-95 transition-all duration-300" />
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-5 text-sm">
          Progress: {currentUnlocked.length} / 9
        </p>

        <p className="mt-3 text-xs text-gray-500">
          You can unlock up to 2 puzzle pieces per day.
        </p>

        {message && (
          <p className="mt-2 text-xs text-red-500">
            {message}
          </p>
        )}

        {currentEmail && (
          <p className="mt-2 text-xs text-gray-500 break-all">
            Current email: {currentEmail}
          </p>
        )}
      </div>
    </main>
  )
}