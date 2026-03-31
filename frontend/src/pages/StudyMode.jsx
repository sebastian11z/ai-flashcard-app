import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDeck, getCards, getErrorMessage } from '@/services/api'
import { Button } from '@/components/ui/button'
import FlashCard from '@/components/FlashCard'

export default function StudyMode() {
  const { id: deckId } = useParams()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [d, c] = await Promise.all([getDeck(deckId), getCards(deckId)])
      setDeck(d)
      setCards(c)
      setIndex(0)
      setFlipped(false)
    } catch (err) {
      setError(getErrorMessage(err))
      setDeck(null)
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [deckId])

  useEffect(() => {
    load()
  }, [load])

  const current = cards[index]
  const total = cards.length

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && current) {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current])

  function goPrev() {
    setFlipped(false)
    setIndex((i) => Math.max(0, i - 1))
  }

  function goNext() {
    setFlipped(false)
    setIndex((i) => Math.min(total - 1, i + 1))
  }

  if (loading) {
    return <p className="text-sm text-stone-500 dark:text-zinc-400">Loading study session…</p>
  }

  if (error || !deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700 dark:text-red-300">{error || 'Deck not found.'}</p>
        <Button asChild variant="secondary">
          <Link to="/dashboard">Back</Link>
        </Button>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-stone-600 dark:text-zinc-300">
          <Link to={`/decks/${deckId}`}>← Back to deck</Link>
        </Button>
        <p className="text-sm text-stone-500 dark:text-zinc-400">
          This deck has no cards to study yet.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8">
      <div className="flex w-full items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="text-stone-600 dark:text-zinc-300">
          <Link to={`/decks/${deckId}`}>← Deck</Link>
        </Button>
        <p className="text-sm tabular-nums text-stone-500 dark:text-zinc-400">
          Card {index + 1} of {total}
        </p>
      </div>

      <FlashCard
        front={current.front}
        back={current.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        className="max-w-full"
      />

      <p className="text-center text-xs text-stone-400 dark:text-zinc-500">
        Click the card or press Space to flip
      </p>

      <div className="flex w-full max-w-xl justify-between gap-4">
        <Button type="button" variant="secondary" disabled={index === 0} onClick={goPrev}>
          Previous
        </Button>
        <Button type="button" variant="secondary" disabled={index >= total - 1} onClick={goNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
