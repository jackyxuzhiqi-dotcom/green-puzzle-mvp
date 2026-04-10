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

    if (!userData) {
      userData = {
        unlocked: [],
        todayCount: 0,
        lastDate: today,
      }
    }

    if (userData.lastDate !== today) {
      userData.todayCount = 0
      userData.lastDate = today
    }

    if (userData.todayCount >= 3) {
      setMessage('Today’s mission is complete 🌱')
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

    const reachedLimit = userData.todayCount >= 3

    setProgressMap((prev) => ({
      ...prev,
      [normalizedEmail]: { ...userData },
    }))

    setCurrentEmail(normalizedEmail)
    setEmail('')

    if (reachedLimit) {
      setMessage('Today’s mission is complete 🌱')
    } else {
      setMessage('')
    }
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
          You can unlock up to 3 puzzle pieces per day.
        </p>

        {message && (
          <p className="mt-2 text-xs text-green-600">
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