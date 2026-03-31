import { useCallback, useEffect, useState } from 'react'
import {
  getDecks,
  getCards,
  createDeck,
  deleteDeck,
  getErrorMessage,
} from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DeckCard from '@/components/DeckCard'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function Dashboard() {
  const [decks, setDecks] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const list = await getDecks()
      setDecks(list)
      const next = {}
      await Promise.all(
        list.map(async (d) => {
          try {
            const cards = await getCards(d.id)
            next[d.id] = cards.length
          } catch {
            next[d.id] = 0
          }
        })
      )
      setCounts(next)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreateDeck(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      await createDeck(newTitle.trim())
      setNewTitle('')
      setOpen(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDeck(id) {
    if (!window.confirm('Delete this deck and all its cards?')) return
    try {
      await deleteDeck(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Your decks</h1>
          <p className="mt-1 text-sm text-stone-500">Create, open, or remove study decks.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">New deck</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateDeck}>
              <DialogHeader>
                <DialogTitle>New deck</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Deck title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving || !newTitle.trim()}>
                  {saving ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">Loading decks…</p>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pale-oak/55 bg-white/80 py-16 text-center text-sm text-stone-500">
          No decks yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              cardCount={counts[deck.id] ?? 0}
              onDelete={handleDeleteDeck}
            />
          ))}
        </div>
      )}
    </div>
  )
}
