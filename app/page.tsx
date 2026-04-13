'use client'

import { useMemo, useState } from 'react'

type UserProgress = {
  unlocked: number[]
  todayCount: number
  lastDate: string
}

type ProgressMap = Record<string, UserProgress>

type Step = 'intro' | 'email' | 'puzzle'

export default function Home() {
  const [step, setStep] = useState<Step>('intro')
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

  const handleEmailContinue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    setCurrentEmail(normalizedEmail)
    setMessage('')
    setStep('puzzle')
  }

  const handleRecycle = () => {
    if (!currentEmail) return

    let userData = progressMap[currentEmail]

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

    if (userData.todayCount >= 1) {
      setMessage('Today’s mission is complete 🌱')
      return
    }

    const remaining = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !userData.unlocked.includes(i)
    )

    if (remaining.length === 0) {
      setMessage(
        'Puzzle completed 🎉 We will notify you by email with reward collection details.'
      )
      return
    }

    const randomIndex =
      remaining[Math.floor(Math.random() * remaining.length)]

    userData.unlocked.push(randomIndex)
    userData.todayCount += 1

    setProgressMap((prev) => ({
      ...prev,
      [currentEmail]: { ...userData },
    }))

    const totalUnlocked = userData.unlocked.length

    if (totalUnlocked === 9) {
      setMessage(
        'Puzzle completed 🎉 We will notify you by email with reward collection details.'
      )
      return
    }

    if (userData.todayCount >= 1) {
      setMessage('Today’s mission is complete 🌱')
      return
    }

    if (totalUnlocked >= 6) {
      setMessage('You’re almost there 👀')
    } else if (totalUnlocked >= 3) {
      setMessage('Great start 🌱')
    } else {
      setMessage('')
    }
  }

  const handleStart = () => {
    setStep('email')
  }

  const handleBackToIntro = () => {
    setStep('intro')
    setMessage('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md rounded-[2rem] border-2 p-8 shadow-sm">
        {step === 'intro' && (
          <>
            <h1 className="text-center text-2xl font-semibold mb-4">
              Green Puzzle
            </h1>

            <p className="text-sm text-gray-700 leading-6 mb-4">
              Welcome to Green Puzzle, a simple recycling challenge designed to
              encourage daily sustainable action.
            </p>

            <p className="text-sm text-gray-700 leading-6 mb-4">
              Each time you recycle and participate, you can unlock a random
              puzzle piece and gradually reveal the full image.
            </p>

            <p className="text-sm text-gray-700 leading-6 mb-8">
              Complete the puzzle to unlock the final reward 🎁
            </p>

            <button
              onClick={handleStart}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
            >
              Get Started
            </button>
          </>
        )}

        {step === 'email' && (
          <>
            <h1 className="text-center text-2xl font-semibold mb-4">
              Green Puzzle
            </h1>

            <p className="text-center text-sm text-gray-600 mb-6">
              Enter your school email to save your progress
            </p>

            <form onSubmit={handleEmailContinue} className="space-y-4">
              <input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg outline-none"
              />

              <p className="text-xs text-gray-500 leading-5">
                Please use your school email to participate. Your email will be
                used to save your progress and notify you how to collect your
                reward after the puzzle is completed.
              </p>

              <button
                type="submit"
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
              >
                Continue
              </button>
            </form>

            <button
              onClick={handleBackToIntro}
              className="w-full mt-4 text-sm text-gray-500"
            >
              Back
            </button>
          </>
        )}

        {step === 'puzzle' && (
          <>
            <h1 className="text-center text-2xl font-semibold mb-3">
              Green Puzzle
            </h1>

            <p className="text-center text-sm text-gray-600 mb-6">
              Recycle to unlock one puzzle piece per day 🌱
            </p>

            <button
              onClick={handleRecycle}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
            >
              Recycle
            </button>

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

            <p className="mt-3 text-xs text-gray-500 leading-5">
              You can unlock up to 1 puzzle piece per day. After the full puzzle
              is completed, reward collection details will be sent by email.
              Please use your school email.
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
          </>
        )}
      </div>
    </main>
  )
}