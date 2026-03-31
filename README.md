# PromptCards

link: https://ai-flashcard-app-ebon.vercel.app/
---

A full-stack AI-powered flashcard web app that generates study cards from pasted notes or uploaded PDFs using Google Gemini. Built as a portfolio project by a Computer Science student.

---

## Features

- Register and login with JWT authentication
- Create and manage multiple flashcard decks
- Generate flashcards from pasted notes via Google Gemini AI
- Generate flashcards from uploaded PDF files (text-based)
- Manually add, edit, and delete cards
- Study mode with card flip animation and keyboard navigation
- All decks and cards are private to each authenticated user

---

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (hosted on Railway)
- Prisma ORM
- JSON Web Tokens (JWT) + bcryptjs
- Google Gemini API (`gemini-1.5-flash`)
- multer (PDF uploads)
- pdf-parse (PDF text extraction)

### Frontend
- React + Vite
- Tailwind CSS + shadcn/ui
- Axios
- React Router
- React Context (auth state)

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database (Railway, Supabase, or local)
- Google Gemini API key (get one at aistudio.google.com)

### Backend Setup

1. Clone the repo and navigate to the backend folder
   ```
   git clone https://github.com/yourusername/aralan.git
   cd aralan/backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-1.5-flash
   PORT=3000
   ```

4. Run database migrations
   ```
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Start the server
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend folder
   ```
   cd aralan/frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Start the dev server
   ```
   npm run dev
   ```

---

## API Endpoints

### Auth
| Method | Endpoint         | Auth | Description       |
|--------|------------------|------|-------------------|
| POST   | /auth/register   | ❌   | Register a user   |
| POST   | /auth/login      | ❌   | Login, get token  |

### Decks
| Method | Endpoint         | Auth | Description         |
|--------|------------------|------|---------------------|
| GET    | /decks           | ✅   | Get all user decks  |
| POST   | /decks           | ✅   | Create a deck       |
| PATCH  | /decks/:id       | ✅   | Update deck title   |
| DELETE | /decks/:id       | ✅   | Delete a deck       |

### Cards
| Method | Endpoint                        | Auth | Description       |
|--------|---------------------------------|------|-------------------|
| GET    | /decks/:deckId/cards            | ✅   | Get all cards     |
| POST   | /decks/:deckId/cards            | ✅   | Create a card     |
| PATCH  | /decks/:deckId/cards/:id        | ✅   | Update a card     |
| DELETE | /decks/:deckId/cards/:id        | ✅   | Delete a card     |

### AI Generation
| Method | Endpoint                  | Auth | Description                        |
|--------|---------------------------|------|------------------------------------|
| POST   | /decks/:deckId/generate   | ✅   | Generate cards from text or PDF    |

For text: send JSON body `{ "notes": "your notes here" }`  
For PDF: send `multipart/form-data` with a `file` field containing the PDF

All protected routes require:
```
Authorization: Bearer <your_token>
```

---

## Data Model

```
User
 └── Deck (many)
      └── Card (many)
```

- Users own their decks — no cross-user data access
- Deleting a deck cascades and deletes all its cards

---

## Deployment

- **Backend** — Render
- **Frontend** — Vercel
- **Database** — Railway (PostgreSQL)

---

## Notes

- Scanned or image-only PDFs are not supported — text must be extractable
- Gemini free tier is used — heavy usage may hit rate limits
- PDF binaries are not stored — text is extracted in-request and discarded
