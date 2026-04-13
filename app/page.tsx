'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Step = 'intro' | 'email' | 'puzzle'

type PuzzleProgressRow = {
  id?: number
  email: string
  unlocked_pieces: number[]
  last_unlock_date: string | null
  today_count: number
  reward_claimed: boolean
  updated_at?: string
}

export default function Home() {
  const [step, setStep] = useState<Step>('intro')
  const [email, setEmail] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [progress, setProgress] = useState<PuzzleProgressRow | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const currentUnlocked = useMemo(() => {
    return progress?.unlocked_pieces ?? []
  }, [progress])

  const loadOrCreateProgress = async (normalizedEmail: string) => {
    const { data: existing, error: fetchError } = await supabase
      .from('puzzle_progress')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (existing) {
      const normalizedExisting: PuzzleProgressRow = {
        ...existing,
        unlocked_pieces: Array.isArray(existing.unlocked_pieces)
          ? existing.unlocked_pieces
          : [],
        today_count: existing.today_count ?? 0,
        last_unlock_date: existing.last_unlock_date ?? null,
        reward_claimed: existing.reward_claimed ?? false,
      }

      if (normalizedExisting.last_unlock_date !== today) {
        const { data: resetData, error: resetError } = await supabase
          .from('puzzle_progress')
          .update({
            today_count: 0,
            last_unlock_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail)
          .select()
          .single()

        if (resetError) {
          throw resetError
        }

        return {
          ...resetData,
          unlocked_pieces: Array.isArray(resetData.unlocked_pieces)
            ? resetData.unlocked_pieces
            : [],
        } as PuzzleProgressRow
      }

      return normalizedExisting
    }

    const newRow: PuzzleProgressRow = {
      email: normalizedEmail,
      unlocked_pieces: [],
      last_unlock_date: today,
      today_count: 0,
      reward_claimed: false,
    }

    const { data: created, error: insertError } = await supabase
      .from('puzzle_progress')
      .insert(newRow)
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return {
      ...created,
      unlocked_pieces: Array.isArray(created.unlocked_pieces)
        ? created.unlocked_pieces
        : [],
    } as PuzzleProgressRow
  }

  const handleEmailContinue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return

    if (!normalizedEmail.endsWith('@callutheran.edu')) {
      setMessage('Please use your CLU email (@callutheran.edu) to participate.')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const row = await loadOrCreateProgress(normalizedEmail)

      setCurrentEmail(normalizedEmail)
      setProgress(row)
      setStep('puzzle')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRecycle = async () => {
    if (!currentEmail) return
    if (!progress) return

    try {
      setLoading(true)
      setMessage('')

      let latest = progress

      if (latest.last_unlock_date !== today) {
        const { data: resetData, error: resetError } = await supabase
          .from('puzzle_progress')
          .update({
            today_count: 0,
            last_unlock_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('email', currentEmail)
          .select()
          .single()

        if (resetError) {
          throw resetError
        }

        latest = {
          ...resetData,
          unlocked_pieces: Array.isArray(resetData.unlocked_pieces)
            ? resetData.unlocked_pieces
            : [],
        } as PuzzleProgressRow
      }

      if ((latest.unlocked_pieces ?? []).length >= 9) {
        setMessage(
          latest.reward_claimed
            ? 'Puzzle completed 🎉 Your reward has already been claimed.'
            : 'Puzzle completed 🎉 A $5 Starbucks gift card will be sent to your email. Each email can only receive one reward.'
        )
        setProgress(latest)
        return
      }

      if ((latest.today_count ?? 0) >= 1) {
        setMessage('Today’s mission is complete 🌱')
        setProgress(latest)
        return
      }

      const remaining = Array.from({ length: 9 }, (_, i) => i).filter(
        (i) => !(latest.unlocked_pieces ?? []).includes(i)
      )

      if (remaining.length === 0) {
        setMessage(
          latest.reward_claimed
            ? 'Puzzle completed 🎉 Your reward has already been claimed.'
            : 'Puzzle completed 🎉 A $5 Starbucks gift card will be sent to your email. Each email can only receive one reward.'
        )
        setProgress(latest)
        return
      }

      const randomIndex =
        remaining[Math.floor(Math.random() * remaining.length)]

      const updatedUnlocked = [...(latest.unlocked_pieces ?? []), randomIndex]

      const { data: updated, error: updateError } = await supabase
        .from('puzzle_progress')
        .update({
          unlocked_pieces: updatedUnlocked,
          today_count: 1,
          last_unlock_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('email', currentEmail)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedRow: PuzzleProgressRow = {
        ...updated,
        unlocked_pieces: Array.isArray(updated.unlocked_pieces)
          ? updated.unlocked_pieces
          : [],
      }

      setProgress(updatedRow)

      if (updatedRow.unlocked_pieces.length >= 9) {
        setMessage(
          updatedRow.reward_claimed
            ? 'Puzzle completed 🎉 Your reward has already been claimed.'
            : 'Puzzle completed 🎉 A $5 Starbucks gift card will be sent to your email. Each email can only receive one reward.'
        )
        return
      }

      setMessage('Today’s mission is complete 🌱')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    setStep('email')
    setMessage('')
  }

  const handleBackToIntro = () => {
    setStep('intro')
    setMessage('')
  }

  useEffect(() => {
    if (!currentEmail) return

    const refreshProgress = async () => {
      try {
        const row = await loadOrCreateProgress(currentEmail)
        setProgress(row)
      } catch {
        // keep quiet here
      }
    }

    if (step === 'puzzle') {
      refreshProgress()
    }
  }, [currentEmail, step])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md rounded-[2rem] border-2 p-8 shadow-sm">
        {step === 'intro' && (
          <>
            <h1 className="mb-4 text-center text-2xl font-semibold">
              Green Puzzle
            </h1>

            <p className="mb-4 text-sm leading-6 text-gray-700">
              Welcome to Green Puzzle, a simple campus recycling challenge
              designed to encourage daily sustainable action.
            </p>

            <p className="mb-4 text-sm leading-6 text-gray-700">
              Each time you recycle and participate, you can unlock one random
              puzzle piece and gradually reveal the full image.
            </p>

            <p className="mb-8 text-sm leading-6 text-gray-700">
              Complete all 9 pieces to receive a reward 🎁
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
            <h1 className="mb-4 text-center text-2xl font-semibold">
              Green Puzzle
            </h1>

            <p className="mb-6 text-center text-sm text-gray-600">
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

              <p className="text-xs leading-5 text-gray-500">
                Please use your CLU email. It will be used to save your progress
                and notify you how to collect your reward after the puzzle is
                completed.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>

            {message && (
              <p className="mt-3 text-xs text-red-500">
                {message}
              </p>
            )}

            <button
              onClick={handleBackToIntro}
              className="mt-4 w-full text-sm text-gray-500"
            >
              Back
            </button>
          </>
        )}

        {step === 'puzzle' && (
          <>
            <h1 className="mb-3 text-center text-2xl font-semibold">
              Green Puzzle
            </h1>

            <p className="mb-6 text-center text-sm text-gray-600">
              Recycle to unlock one puzzle piece per day 🌱
            </p>

            <button
              onClick={handleRecycle}
              disabled={loading}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg"
            >
              {loading ? 'Processing...' : 'I Recycled'}
            </button>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => {
                const row = Math.floor(i / 3)
                const col = i % 3
                const isUnlocked = currentUnlocked.includes(i)

                return (
                  <div
                    key={i}
                    className="relative h-24 overflow-hidden rounded-xl border-2"
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

            <p className="mt-3 text-xs leading-5 text-gray-500">
              You can unlock 1 puzzle piece per day. Complete all 9 pieces to
              receive a $5 Starbucks gift card via email. Each email can only
              receive one reward.
            </p>

            {message && (
              <p className="mt-2 text-xs text-green-600">
                {message}
              </p>
            )}

            {currentEmail && (
              <p className="mt-2 break-all text-xs text-gray-500">
                {currentEmail}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}