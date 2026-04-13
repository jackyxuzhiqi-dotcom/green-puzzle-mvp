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

    // ✅ 限制学校邮箱
    if (!normalizedEmail.endsWith('@callutheran.edu')) {
      setMessage('Please use your CLU email (@callutheran.edu) to participate.')
      return
    }

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

    // ✅ 每天只能1次
    if (userData.todayCount >= 1) {
      setMessage('Today’s mission is complete 🌱')
      return
    }

    const remaining = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !userData.unlocked.includes(i)
    )

    if (remaining.length === 0) {
      setMessage(
        'Puzzle completed 🎉 A $5 Starbucks gift card will be sent to your email. Each email can only receive one reward.'
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
        'Puzzle completed 🎉 A $5 Starbucks gift card will be sent to your email. Each email can only receive one reward.'
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

        {/* Intro */}
        {step === 'intro' && (
          <>
            <h1 className="text-center text-2xl font-semibold mb-4">
              Green Puzzle
            </h1>

            <p className="text-sm text-gray-700 mb-4">
              A campus recycling challenge designed to encourage daily sustainable action.
            </p>

            <p className="text-sm text-gray-700 mb-4">
              Each time you recycle, you can unlock a puzzle piece and gradually reveal the full image.
            </p>

            <p className="text-sm text-gray-700 mb-8">
              Complete the puzzle to receive a reward 🎁
            </p>

            <button
              onClick={handleStart}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
            >
              Get Started
            </button>
          </>
        )}

        {/* Email */}
        {step === 'email' && (
          <>
            <h1 className="text-center text-2xl font-semibold mb-4">
              Green Puzzle
            </h1>

            <p className="text-center text-sm text-gray-600 mb-6">
              Enter your CLU email to participate
            </p>

            <form onSubmit={handleEmailContinue} className="space-y-4">
              <input
                type="email"
                placeholder="you@callutheran.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg outline-none"
              />

              <p className="text-xs text-gray-500">
                Please use your CLU email. It will be used to track your progress and send your reward after completion.
              </p>

              <button
                type="submit"
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
              >
                Continue
              </button>
            </form>

            {message && (
              <p className="mt-3 text-xs text-red-500">
                {message}
              </p>
            )}

            <button
              onClick={handleBackToIntro}
              className="w-full mt-4 text-sm text-gray-500"
            >
              Back
            </button>
          </>
        )}

        {/* Puzzle */}
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
              I Recycled
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
                      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 opacity-95" />
                    )}
                  </div>
                )
              })}
            </div>

            <p className="mt-5 text-sm">
              Progress: {currentUnlocked.length} / 9
            </p>

            <p className="mt-3 text-xs text-gray-500">
              You can unlock 1 puzzle piece per day. Complete all 9 pieces to receive a $5 Starbucks gift card via email. Each email can only receive one reward.
            </p>

            {message && (
              <p className="mt-2 text-xs text-green-600">
                {message}
              </p>
            )}

            {currentEmail && (
              <p className="mt-2 text-xs text-gray-500 break-all">
                {currentEmail}
              </p>
            )}
          </>
        )}

      </div>
    </main>
  )
}