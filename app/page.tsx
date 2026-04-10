'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email) {
      setMessage('Please enter your email.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('participants')
      .upsert({ email }, { onConflict: 'email' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Email saved successfully.')
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-3">Green Puzzle MVP</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email to start tracking your puzzle progress.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border px-4 py-3"
          >
            {loading ? 'Submitting...' : 'Continue'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}