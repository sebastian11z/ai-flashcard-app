import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getDeck,
  getCards,
  createCard,
  updateCard,
  deleteCard,
  generateCardsFromNotes,
  generateCardsFromPdf,
  getErrorMessage,
} from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeckPage() {
  const { id: deckId } = useParams()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [adding, setAdding] = useState(false)

  const [notes, setNotes] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [previewCards, setPreviewCards] = useState(null)
  const [previewBusy, setPreviewBusy] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [d, c] = await Promise.all([getDeck(deckId), getCards(deckId)])
      setDeck(d)
      setCards(c)
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

  async function handleAddCard(e) {
    e.preventDefault()
    if (!newFront.trim() || !newBack.trim()) return
    setAdding(true)
    try {
      await createCard(deckId, { front: newFront.trim(), back: newBack.trim() })
      setNewFront('')
      setNewBack('')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  function startEdit(card) {
    setEditingId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  async function saveEdit(cardId) {
    if (!editFront.trim() || !editBack.trim()) return
    try {
      await updateCard(deckId, cardId, {
        front: editFront.trim(),
        back: editBack.trim(),
      })
      setEditingId(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDeleteCard(cardId) {
    if (!window.confirm('Delete this card?')) return
    try {
      await deleteCard(deckId, cardId)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleGenerate() {
    setError('')
    if (pdfFile && notes.trim()) {
      setError('Use either pasted notes or a PDF, not both.')
      return
    }
    if (!pdfFile && !notes.trim()) {
      setError('Paste notes or choose a PDF to generate from.')
      return
    }
    setGenerating(true)
    try {
      let data
      if (pdfFile) {
        data = await generateCardsFromPdf(deckId, pdfFile, {})
      } else {
        data = await generateCardsFromNotes(deckId, notes.trim(), {})
      }
      setPreviewCards(data.cards || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function handlePreviewCancel() {
    if (!previewCards?.length) {
      setPreviewCards(null)
      return
    }
    setPreviewBusy(true)
    try {
      await Promise.all(previewCards.map((c) => deleteCard(deckId, c.id)))
      setPreviewCards(null)
      setNotes('')
      setPdfFile(null)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPreviewBusy(false)
    }
  }

  async function handlePreviewConfirm() {
    setPreviewCards(null)
    setNotes('')
    setPdfFile(null)
    await load()
  }

  if (loading && !deck) {
    return <p className="text-sm text-stone-500 dark:text-zinc-400">Loading deck…</p>
  }

  if (!deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-700 dark:text-red-300">{error || 'Deck not found.'}</p>
        <Button asChild variant="secondary">
          <Link to="/dashboard">Back to decks</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 text-stone-600 dark:text-zinc-300"
          >
            <Link to="/dashboard">← All decks</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
            {deck.title}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
            {cards.length} cards in this deck.
          </p>
        </div>
        <Button asChild>
          <Link to={`/decks/${deckId}/study`}>Study mode</Link>
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 dark:text-zinc-100">Generate with AI</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Paste notes</Label>
              <Textarea
                id="notes"
                placeholder="Paste lecture notes or reading here…"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  if (e.target.value) setPdfFile(null)
                }}
                disabled={!!pdfFile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf">Or upload PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                disabled={!!notes.trim()}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setPdfFile(f || null)
                  if (f) setNotes('')
                }}
              />
            </div>
            <Button type="button" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        {previewCards ? (
          <Card className="border-lilac/35 bg-pale-oak/25 dark:border-zinc-600 dark:bg-zinc-800/60">
            <CardHeader>
              <CardTitle className="text-base">Preview — {previewCards.length} new cards</CardTitle>
              <p className="text-sm text-stone-600 dark:text-zinc-300">
                Cards are saved on the server. Confirm to keep them, or cancel to remove this batch.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="max-h-60 space-y-2 overflow-y-auto text-sm">
                {previewCards.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-pale-oak/50 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                  >
                    <span className="font-medium text-stone-800 dark:text-zinc-100">{c.front}</span>
                    <span className="text-stone-400 dark:text-zinc-500"> → </span>
                    <span className="text-stone-600 dark:text-zinc-300">{c.back}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={previewBusy}
                  onClick={handlePreviewCancel}
                >
                  {previewBusy ? 'Removing…' : 'Cancel (remove these cards)'}
                </Button>
                <Button type="button" disabled={previewBusy} onClick={handlePreviewConfirm}>
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 dark:text-zinc-100">Add card manually</h2>
        <form onSubmit={handleAddCard} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nf">Front</Label>
              <Input
                id="nf"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Question or term"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nb">Back</Label>
              <Input
                id="nb"
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Answer"
              />
            </div>
          </div>
          <Button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 dark:text-zinc-100">All cards</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-zinc-400">
            No cards yet. Add some or generate from notes.
          </p>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => (
              <li key={card.id}>
                <Card>
                  <CardContent className="py-4">
                    {editingId === card.id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                          />
                          <Input
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => saveEdit(card.id)}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium text-stone-900 dark:text-zinc-100">
                              {card.front}
                            </span>
                          </p>
                          <p className="text-stone-600 dark:text-zinc-300">{card.back}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(card)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
