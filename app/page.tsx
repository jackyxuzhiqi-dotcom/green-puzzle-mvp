'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [unlocked, setUnlocked] = useState<number[]>([])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return

    const remaining = Array.from({ length: 9 })
      .map((_, i) => i)
      .filter((i) => !unlocked.includes(i))

    if (remaining.length === 0) return

    const randomIndex =
      remaining[Math.floor(Math.random() * remaining.length)]

    setUnlocked([...unlocked, randomIndex])
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

        <div className="mt-8 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const isUnlocked = unlocked.includes(i)

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
          Progress: {unlocked.length} / 9
        </p>

        <p className="mt-3 text-xs text-gray-500">
          You can unlock up to one puzzle piece per day.
        </p>
      </div>
    </main>
  )
}