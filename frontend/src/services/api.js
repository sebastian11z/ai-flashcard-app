import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flashcard_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(err) {
  const msg = err.response?.data?.message
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg)) return msg.join(', ')
  if (err.message) return err.message
  return 'Something went wrong. Please try again.'
}

export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password })
  return data
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function getDecks() {
  const { data } = await api.get('/decks')
  return data
}

export async function getDeck(id) {
  const { data } = await api.get(`/decks/${id}`)
  return data
}

export async function createDeck(title) {
  const { data } = await api.post('/decks', { title })
  return data
}

export async function updateDeck(id, title) {
  const { data } = await api.patch(`/decks/${id}`, { title })
  return data
}

export async function deleteDeck(id) {
  await api.delete(`/decks/${id}`)
}

export async function getCards(deckId) {
  const { data } = await api.get(`/decks/${deckId}/cards`)
  return data
}

export async function createCard(deckId, payload) {
  const { data } = await api.post(`/decks/${deckId}/cards`, payload)
  return data
}

export async function updateCard(deckId, cardId, payload) {
  const { data } = await api.patch(`/decks/${deckId}/cards/${cardId}`, payload)
  return data
}

export async function deleteCard(deckId, cardId) {
  await api.delete(`/decks/${deckId}/cards/${cardId}`)
}

/** JSON body: pasted notes */
export async function generateCardsFromNotes(deckId, notes, options) {
  const { data } = await api.post(`/decks/${deckId}/generate`, {
    notes,
    ...(options && Object.keys(options).length ? { options } : {}),
  })
  return data
}

/** multipart/form-data, field name `file` */
export async function generateCardsFromPdf(deckId, file, options) {
  const form = new FormData()
  form.append('file', file)
  if (options && Object.keys(options).length) {
    form.append('options', JSON.stringify(options))
  }
  const token = localStorage.getItem('flashcard_token')
  const { data } = await axios.post(`${baseURL}/decks/${deckId}/generate`, form, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}
