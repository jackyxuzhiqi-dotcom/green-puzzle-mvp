'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Step = 'intro' | 'email' | 'puzzle' | 'success'

type PuzzleProgressRow = {
  id?: number
  email: string
  unlocked_pieces: number[]
  last_unlock_date: string | null
  today_count: number
  reward_claimed: boolean
  updated_at?: string
}

const greenFacts = [
  'Recycling one aluminum can saves enough energy to power a TV for about 3 hours.',
  'Plastic bottles can take over 400 years to break down if not properly recycled.',
  'Glass can be recycled endlessly without losing quality or purity.',
  'Every recycled bottle or can is one less item in a landfill or the ocean.',
  'Recycling aluminum uses up to 95% less energy than making it from raw materials.',
  'The average person generates over 4 pounds of waste every day.',
  'Only about 9% of plastic ever produced has been recycled globally.',
  'A single recycled plastic bottle can be turned into clothing, carpets, or new containers.',
  'Small actions, repeated daily, can create a big environmental impact.',
]

export default function Home() {
  const [step, setStep] = useState<Step>('intro')
  const [email, setEmail] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [progress, setProgress] = useState<PuzzleProgressRow | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [selectedFact, setSelectedFact] = useState<string | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const isSameDay = (dateStr: string | null, todayStr: string) => {
    return dateStr === todayStr
  }

  const currentUnlocked = useMemo(() => {
    return progress?.unlocked_pieces ?? []
  }, [progress])

  const openFactModal = (pieceIndex: number) => {
    setSelectedPiece(pieceIndex + 1)
    setSelectedFact(greenFacts[pieceIndex])
  }

  const closeFactModal = () => {
    setSelectedFact(null)
    setSelectedPiece(null)
  }

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
      return {
        ...existing,
        unlocked_pieces: Array.isArray(existing.unlocked_pieces)
          ? existing.unlocked_pieces
          : [],
        today_count: existing.today_count ?? 0,
        last_unlock_date: existing.last_unlock_date ?? null,
        reward_claimed: existing.reward_claimed ?? false,
      } as PuzzleProgressRow
    }

    const newRow: PuzzleProgressRow = {
      email: normalizedEmail,
      unlocked_pieces: [],
      last_unlock_date: null,
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
      today_count: created.today_count ?? 0,
      last_unlock_date: created.last_unlock_date ?? null,
      reward_claimed: created.reward_claimed ?? false,
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

      if ((row.unlocked_pieces ?? []).length >= 9) {
        setStep('success')
      } else {
        setStep('puzzle')
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRecycle = async () => {
    if (!currentEmail || !progress) return

    try {
      setLoading(true)
      setMessage('')

      const latestUnlocked = progress.unlocked_pieces ?? []

      const alreadyUnlockedToday =
        isSameDay(progress.last_unlock_date, today) &&
        (progress.today_count ?? 0) >= 1

      if (alreadyUnlockedToday) {
        setMessage("You've already unlocked today's piece. Come back tomorrow 🌱")
        return
      }

      if (latestUnlocked.length >= 9) {
        if (!progress.reward_claimed) {
          const { data: completedRow, error: completeError } = await supabase
            .from('puzzle_progress')
            .update({
              reward_claimed: true,
              updated_at: new Date().toISOString(),
            })
            .eq('email', currentEmail)
            .select()
            .single()

          if (completeError) {
            throw completeError
          }

          setProgress({
            ...completedRow,
            unlocked_pieces: Array.isArray(completedRow.unlocked_pieces)
              ? completedRow.unlocked_pieces
              : [],
            today_count: completedRow.today_count ?? 0,
            last_unlock_date: completedRow.last_unlock_date ?? null,
            reward_claimed: completedRow.reward_claimed ?? false,
          } as PuzzleProgressRow)
        }

        setStep('success')
        return
      }

      const remaining = Array.from({ length: 9 }, (_, i) => i).filter(
        (i) => !latestUnlocked.includes(i)
      )

      if (remaining.length === 0) {
        const { data: completedRow, error: completeError } = await supabase
          .from('puzzle_progress')
          .update({
            reward_claimed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('email', currentEmail)
          .select()
          .single()

        if (completeError) {
          throw completeError
        }

        setProgress({
          ...completedRow,
          unlocked_pieces: Array.isArray(completedRow.unlocked_pieces)
            ? completedRow.unlocked_pieces
            : [],
          today_count: completedRow.today_count ?? 0,
          last_unlock_date: completedRow.last_unlock_date ?? null,
          reward_claimed: completedRow.reward_claimed ?? false,
        } as PuzzleProgressRow)

        setStep('success')
        return
      }

      let nextPieceIndex: number

      // Keep piece 0 as the very last one to unlock.
      if (latestUnlocked.length === 8 && remaining.includes(0)) {
        nextPieceIndex = 0
      } else {
        const randomPool = remaining.filter((i) => i !== 0)
        nextPieceIndex =
          randomPool[Math.floor(Math.random() * randomPool.length)]
      }

      const updatedUnlocked = [...latestUnlocked, nextPieceIndex]
      const isCompleted = updatedUnlocked.length >= 9

      const { data: updated, error: updateError } = await supabase
        .from('puzzle_progress')
        .update({
          unlocked_pieces: updatedUnlocked,
          today_count: 1,
          last_unlock_date: today,
          reward_claimed: isCompleted ? true : progress.reward_claimed,
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
        today_count: updated.today_count ?? 0,
        last_unlock_date: updated.last_unlock_date ?? null,
        reward_claimed: updated.reward_claimed ?? false,
      }

      setProgress(updatedRow)

      if (updatedRow.unlocked_pieces.length >= 9) {
        openFactModal(nextPieceIndex)
        setStep('success')
        return
      }

      if (updatedRow.unlocked_pieces.length >= 6) {
        setMessage('You’re almost there 👀')
      } else if (updatedRow.unlocked_pieces.length >= 3) {
        setMessage('Great progress 🌱')
      } else {
        setMessage('Nice start 🌿')
      }

      openFactModal(nextPieceIndex)
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

  const handlePieceClick = (pieceIndex: number, isUnlocked: boolean) => {
    if (!isUnlocked) return
    openFactModal(pieceIndex)
  }

  useEffect(() => {
    if (!currentEmail || step !== 'puzzle') return

    const refreshProgress = async () => {
      try {
        const row = await loadOrCreateProgress(currentEmail)
        setProgress(row)
      } catch {
        // ignore for now
      }
    }

    refreshProgress()
  }, [currentEmail, step])

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-[2rem] border-2 p-8 shadow-sm">
        {step === 'intro' && (
          <>
            <h1 className="mb-4 text-center text-2xl font-bold">
              Green Puzzle
            </h1>

            <p className="mb-4 text-sm font-medium leading-7 text-gray-700">
              Welcome to Green Puzzle, a simple campus recycling challenge
              designed to encourage daily sustainable action.
            </p>

            <p className="mb-4 text-sm font-medium leading-7 text-gray-700">
              Each time you recycle and participate, you can unlock one random
              puzzle piece and gradually reveal the full image.
            </p>

            <p className="mb-8 text-sm font-medium leading-7 text-gray-700">
              Complete all 9 pieces to receive a reward 🎁
            </p>

            <button
              onClick={handleStart}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg font-semibold"
            >
              Get Started
            </button>
          </>
        )}

        {step === 'email' && (
          <>
            <h1 className="mb-4 text-center text-2xl font-bold">
              Green Puzzle
            </h1>

            <p className="mb-6 text-center text-sm font-medium text-gray-600">
              Enter your CLU email to participate
            </p>

            <form onSubmit={handleEmailContinue} className="space-y-4">
              <input
                type="email"
                placeholder="you@callutheran.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg font-medium outline-none"
              />

              <p className="text-xs font-medium leading-6 text-gray-500">
                Please use your CLU email. It will be used to save your progress
                and notify you how to collect your reward after the puzzle is
                completed. No spam — just for this challenge.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg font-semibold"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>

            {message && (
              <p className="mt-3 text-xs font-medium text-red-500">{message}</p>
            )}

            <button
              onClick={handleBackToIntro}
              className="mt-4 w-full text-sm font-medium text-gray-500"
            >
              Back
            </button>
          </>
        )}

        {step === 'puzzle' && (
          <>
            <h1 className="mb-3 text-center text-2xl font-bold">
              Green Puzzle
            </h1>

            <p className="mb-6 text-center text-sm font-medium text-gray-600">
              Recycle and unlock one puzzle piece each day 🌱
            </p>

            <button
              onClick={handleRecycle}
              disabled={loading}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg font-semibold"
            >
              {loading ? 'Processing...' : 'I Recycled'}
            </button>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => {
                const row = Math.floor(i / 3)
                const col = i % 3
                const isUnlocked = currentUnlocked.includes(i)

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePieceClick(i, isUnlocked)}
                    disabled={!isUnlocked}
                    className={`relative h-24 overflow-hidden rounded-xl border-2 transition-transform duration-200 ${
                      isUnlocked
                        ? 'cursor-pointer hover:scale-[1.02]'
                        : 'cursor-not-allowed'
                    }`}
                    style={{
                      backgroundImage: `url('/puzzle.jpg')`,
                      backgroundSize: '300% 300%',
                      backgroundPosition: `${col * 50}% ${row * 50}%`,
                    }}
                    aria-label={
                      isUnlocked
                        ? `Open puzzle piece ${i + 1} green fact`
                        : `Locked puzzle piece ${i + 1}`
                    }
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700 opacity-95 transition-all duration-300" />
                    )}
                  </button>
                )
              })}
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-800">
              Progress: {currentUnlocked.length} / 9
            </p>

            <p className="mt-3 text-xs font-medium leading-6 text-gray-500">
              Each CLU email can unlock one puzzle piece per day.
            </p>

            <p className="mt-2 text-xs font-medium leading-6 text-gray-500">
              Tap any unlocked piece to view its green fact.
            </p>

            {message && (
              <p className="mt-2 text-xs font-medium text-green-600">
                {message}
              </p>
            )}

            {currentEmail && (
              <p className="mt-2 break-all text-xs font-medium text-gray-500">
                {currentEmail}
              </p>
            )}
          </>
        )}

        {step === 'success' && (
          <>
            <h1 className="mb-4 text-center text-2xl font-bold text-green-700">
              Congratulations 🎉
            </h1>

            <p className="mb-4 text-center text-sm font-medium leading-7 text-gray-700">
              You completed the Green Puzzle.
            </p>

            <p className="mb-6 text-center text-sm font-medium leading-7 text-gray-700">
              Your reward is on the way 🎁
            </p>

            <p className="mb-6 break-all text-center text-xs font-medium leading-6 text-gray-500">
              {currentEmail}
            </p>

            <button
              onClick={() => setStep('puzzle')}
              className="w-full rounded-[1.5rem] border-2 px-4 py-4 text-lg font-semibold"
            >
              Back
            </button>
          </>
        )}
      </div>

      {selectedFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-xl font-bold text-green-700">
              Piece {selectedPiece} 🌱
            </h2>

            <p className="font-medium leading-7 text-gray-700">{selectedFact}</p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeFactModal}
                className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}