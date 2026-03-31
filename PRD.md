# AI-Powered Flashcard App — Product Requirements Document

**Status:** MVP scope (single source of truth)  
**Stack:** React (Vite + TypeScript) · Node.js · Express · PostgreSQL · Google Gemini · JWT auth

---

## 1. Product overview

Students and self-learners often have notes, lecture snippets, slides, or PDF readings they want to turn into study material, but manual card creation is slow and inconsistent. This product is a web application that lets users **paste plain text or upload a PDF**, extract text server-side, generate flashcards using Google’s Gemini API with structured, validated output, and persist decks and cards per account on the server. The differentiation is a practical workflow—**paste or upload → generate → edit → study**—with real AI assistance and server-side storage, suitable for a portfolio demo and daily use.

---

## 2. Goals & success criteria

| Goal | Success criterion (MVP) |
|------|-------------------------|
| Fast generation | From a typical paste (e.g. ≤ 8K characters) **or a PDF within MVP size limits** after text extraction, the app returns generated cards in **under ~60 seconds** under normal API conditions (excluding cold starts); very large inputs may be truncated per FR-4. |
| Usable study flow | Users can **flip/reveal** cards in study mode with keyboard-friendly controls. |
| Data ownership | **Decks and cards persist per authenticated user**; no cross-user leakage. |
| Demo quality | A **public demo URL** (frontend + API) works for recruiters: register, create deck, generate, study. |
| Security baseline | **Gemini API key only on the backend**; never embedded in the client bundle. |

---

## 3. User stories (MVP)

- As a user, I can **register and log in** so my decks are private to my account.
- As a user, I can **create, rename, and delete** multiple **decks**.
- As a user, I can **paste notes** (plain text) and **generate** flashcards into a selected deck.
- As a user, I can **upload a PDF** (e.g. lecture notes, book chapter) and **generate** flashcards from the **extracted text** into a selected deck (same outcome as paste, different input).
- As a user, I can **edit and delete** individual cards (front/back).
- As a user, I can **reorder** cards within a deck (conceptually via `order` or equivalent).
- As a user, I can open **study mode** for a deck and navigate cards with flip/reveal.
- As a user, I can **regenerate a single card** (optional MVP—same deck context, replace one card’s content).
- As a user, I see **clear errors** when the AI service fails or limits are hit.

---

## 4. Functional requirements

**FR-1 — Authentication**  
- **Register:** `POST /auth/register` with email (or username) + password; password stored hashed (see NFRs).  
- **Login:** `POST /auth/login` returns tokens per **FR-1a**.  
- **FR-1a (JWT strategy — documented choice):** **Access JWT + refresh token.** Short-lived access token (e.g. 15–60 minutes) for API calls; longer-lived refresh token (httpOnly cookie or secure storage strategy documented in API security notes) used only to obtain new access tokens. Alternative acceptable for MVP: **short-lived access-only JWT** with logout = client discard (document if chosen instead).  
- **Protected routes:** All deck/card/AI endpoints require valid access JWT unless explicitly public.

**FR-2 — Decks CRUD**  
- List, create, read, update (e.g. title), delete decks for the authenticated user only.

**FR-3 — Cards CRUD**  
- List, create, read, update (front, back, optional fields), delete cards within a deck; enforce `deck_id` ownership via user → deck.

**FR-4 — AI generation**  
- Endpoint to generate cards from **either** pasted notes **or** PDF-derived text (see §9), using a **single generation pipeline** after input normalization (extracted plain text).  
- **Text paste:** JSON body with `notes` string; **input length limits** (e.g. max characters after trim).  
- **PDF upload:** `multipart/form-data` with a PDF file part; **allowed type** `application/pdf` only; **max file size** (e.g. 10–15 MB, document exact value in OpenAPI/README). Server **extracts text** (see §7), applies the **same max character cap** as paste (truncate with explicit behavior: e.g. keep start of document + indicate truncation in logs only, not user PII).  
- **Storage (MVP):** Do **not** persist uploaded PDF binaries or full extracted text long-term by default—process in request scope, then discard temp buffers/files unless a future feature requires audit storage.  
- **Scanned/image-only PDFs:** **Out of scope for MVP** unless OCR is added later; return a **clear user message** when extractable text is empty or below a minimum threshold.  
- **Rate limiting** per user or per IP on generation endpoints (basic throttling for MVP).  
- **Structured JSON** from Gemini, validated server-side (e.g. **Zod** or similar schema validation); reject or sanitize invalid payloads.

**FR-5 — Error handling**  
- When Gemini fails (timeout, quota, invalid response): return **user-visible, non-technical** message; log technical detail server-side **without PII** (see NFRs).  
- Standard HTTP status codes: 400 validation (including wrong MIME, oversize file, empty extraction), 401 unauthorized, 403 forbidden, 404 not found, 413 payload too large (if used), 429 rate limit, 502/503 upstream AI failure as appropriate.

**FR-6 — CORS**  
- Express (e.g. **`cors`** middleware) allows the **Vercel production origin** and **localhost** in development, configurable via environment.

---

## 5. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Security** | Passwords hashed with **bcrypt** or **argon2**; **HTTPS** in production; JWT signed with strong secret (`JWT_SECRET`); document **rotation**: new secret deploy + phased token expiry (MVP: single secret with periodic manual rotation acceptable). |
| **Secrets** | `GEMINI_API_KEY` and DB credentials only on server; never in frontend env except public URLs like `VITE_API_URL`. |
| **Performance** | API responds for non-AI CRUD within typical web expectations (< few hundred ms DB-bound); AI path bounded by Gemini latency + validation. |
| **Accessibility** | Baseline: **keyboard** operation for core flows; **labels** on form inputs; sufficient contrast in UI (align with WCAG-oriented practices where feasible for MVP). |
| **Logging** | Structured or clear logs for errors and AI failures; **avoid PII** (no full note body or extracted PDF text in logs by default; truncate or hash identifiers if needed). |
| **Uploads** | Enforce **max PDF size** and **MIME validation**; reject polyglot/abuse where practical; **no execution** of uploaded content; temp files cleaned up on success and failure paths. |
| **Availability** | Graceful degradation message when AI is unavailable; core CRUD still works if AI is down (user can still edit existing cards). |

---

## 6. Out of scope (MVP)

- **Spaced repetition** (e.g. SM-2 scheduling, due dates).  
- **Native mobile apps** (iOS/Android); web responsive is in scope only as far as the React app allows.  
- **Collaborative decks** (sharing, real-time co-editing).  
- **OCR / scanned-PDF** text extraction (image-only PDFs without a text layer are unsupported in MVP—see FR-4).  
- **Other file types** (DOCX, PPTX, images) unless added later.  
- **Multi-language UI** (English-first; generation language may follow user notes or document language).  
- **OAuth social login** (email/password or chosen MVP auth only unless added later).

---

## 7. Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | **React** with **Vite** + **TypeScript** |
| Backend | **Node.js** + **Express** (TypeScript recommended to match frontend; document in README if using plain JavaScript) |
| ORM / migrations | **Prisma** (or **Drizzle** + migrations)—pick one, document choice; schema migrations applied on deploy |
| Validation | **Zod** (or **Joi**) for request bodies and parsed AI JSON |
| Auth | **jsonwebtoken** (or **jose**) for JWTs; **bcrypt** or **argon2** for password hashing |
| Multipart uploads | **multer** or **busboy** (with limits aligned to FR-4) |
| Database | **PostgreSQL** |
| AI | **Google Gemini** via **`@google/generative-ai`** (official Node SDK) or REST |
| PDF text extraction | **pdf-parse**, **pdfjs-dist**, or **pdf2json**—pick one, document choice; must run **server-side** only |

---

## 8. Data model

**Entities**

- **User**  
  - `id` (PK), `email` (or `username`, unique), `password_hash`, `created_at`, `updated_at`.

- **Deck**  
  - `id` (PK), `user_id` (FK → User), `title`, `created_at`, `updated_at`.

- **Card**  
  - `id` (PK), `deck_id` (FK → Deck), `front` (text), `back` (text), optional `source_snippet` (excerpt from notes if useful for provenance), `order` (integer for sort order within deck), `created_at`, `updated_at`.

**Relationships**

- User **1 — N** Decks.  
- Deck **1 — N** Cards.  
- All queries for decks/cards **scoped by authenticated user** via join or ownership checks.

---

## 9. API contract (summary)

Base URL: configurable (e.g. `https://api.example.com`). All protected routes send `Authorization: Bearer <access_token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Body: `{ "email", "password" }` (or username variant). **201** + user summary; **400** validation. |
| POST | `/auth/login` | Body: `{ "email", "password" }`. **200** + `{ "access_token", "refresh_token", "token_type": "bearer" }` (or refresh in cookie). **401** bad credentials. |
| POST | `/auth/refresh` | Body: `{ "refresh_token" }` if not using cookie. **200** new access token. **401** invalid/expired refresh. |
| GET | `/decks` | List current user’s decks. **200** `{ "items": [ ... ] }`. |
| POST | `/decks` | Create deck. Body: `{ "title" }`. **201** deck resource. |
| GET | `/decks/{deck_id}` | Get deck if owned. **404** if missing or not owned. |
| PATCH | `/decks/{deck_id}` | Partial update (e.g. title). **200**. |
| DELETE | `/decks/{deck_id}` | Delete deck (and cascade cards). **204**. |
| GET | `/decks/{deck_id}/cards` | List cards (sorted by `order`). **200**. |
| POST | `/decks/{deck_id}/cards` | Create card manually. Body: `{ "front", "back", "source_snippet?", "order?" }`. **201**. |
| GET | `/decks/{deck_id}/cards/{card_id}` | Get one card. **200** or **404**. |
| PATCH | `/decks/{deck_id}/cards/{card_id}` | Update card. **200**. |
| DELETE | `/decks/{deck_id}/cards/{card_id}` | Delete card. **204**. |
| POST | `/decks/{deck_id}/generate` | **JSON:** Body `{ "notes": "...", "options": { ... } }` — `notes` required for this mode. **OR multipart:** `multipart/form-data` with `file` = PDF (required for this mode), optional `options` as JSON string field if needed. **Exactly one** of `notes` (JSON) or `file` (multipart) per request; **400** if both or neither. After PDF upload, server extracts text then calls the same generation logic as paste. **200** `{ "cards": [ { "front", "back", "source_snippet?" }, ... ] }` (and/or persisted IDs if server saves immediately—implementation choice documented in OpenAPI). **400** validation / empty extraction; **413** file too large if applicable; **429** rate limit; **502/503** AI failure. |

**Alternative:** `POST /ai/generate` with body `{ "deck_id", "notes", "options" }` — equivalent if preferred; PRD assumes `/decks/{id}/generate` for resource clarity.

---

## 10. AI behavior

- **Prompt strategy:** Instruct Gemini to return **structured JSON** only (array of objects with `front` / `back`, optional `source_snippet`), matching your **Zod** (or equivalent) schemas. Reject malformed JSON with a controlled error path.  
- **Validation:** Parse and validate with **Zod** (or equivalent); cap number of cards per request.  
- **Limits:** Set **max tokens** and **max input length** to control cost and latency.  
- **Sanitization:** Treat pasted notes and **extracted PDF text** as **untrusted**—no tool execution, no server-side eval; strip or escape as needed for storage and display (XSS-safe rendering on frontend).  
- **PDF quirks:** Extraction may lose formatting, footnotes, or equations; generation quality depends on extractable text. Empty or near-empty extraction → user-facing error, no Gemini call (or call avoided).  
- **Prompt injection:** Instructions in user content must not override system safety or exfiltrate secrets; system prompt emphasizes assistant-only card generation.  
- **User-visible errors:** e.g. “Couldn’t generate cards right now. Try again in a moment.” with optional support code in logs only.

---

## 11. Environment & deployment

**Frontend (Vercel)**  
- Build-time: `VITE_API_URL` — public base URL of the Express API (no secrets).

**Backend (Railway or Render)**  
- `DATABASE_URL` — PostgreSQL connection string.  
- `JWT_SECRET` — signing key for JWTs.  
- `GEMINI_API_KEY` — Gemini API key (server only).  
- `PORT` — listen port (platform-provided on Railway/Render).  
- CORS origins: production Vercel URL + local dev.

**Migrations**  
- On deploy: run ORM migrations, e.g. **`npx prisma migrate deploy`** (Prisma) or your chosen tool’s equivalent (document exact command in README; CI/CD or Railway release phase).

**Network**  
- Browser → HTTPS → Vercel (static SPA) and HTTPS → API; API → Gemini with API key server-side only.

---

## 12. Testing strategy

- **Automated API tests:** e.g. **Vitest** or **Jest** with **supertest** (or native `fetch` against a test server) for auth (register/login/refresh), deck/card CRUD, and protected-route behavior; mock Gemini in tests for the generation endpoint.  
- **Optional later:** Playwright E2E against staging.  
- **Manual checklist before demo:** register, login, create deck, paste notes, generate, **upload a text-based PDF and generate**, edit card, study mode, logout, error paths (invalid credentials, AI timeout simulated, **oversize PDF**, **empty/scanned PDF** message).

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| **API cost / quotas** | Rate limits; max cards per request; monitor usage; user messaging when limits hit. |
| **Gemini downtime or latency** | Timeouts; user-friendly errors; CRUD still works without AI. |
| **Prompt injection in pasted notes / PDF text** | Structured output only; no code execution; minimal trust in user content; logging without storing full prompts in production logs by default. |
| **Large or malicious PDFs** | Strict size limits; stream/chunk extraction where supported; timeouts; no persistence of binaries; validate MIME. |
| **Scanned PDFs (no text layer)** | Detect low/empty extractable text; return clear UX message; optional future OCR out of scope for MVP. |
| **Token theft** | Short-lived access tokens; HTTPS; secure refresh handling; document logout behavior. |
| **Schema drift from model output** | Strict schema validation (e.g. Zod); retry or single repair pass optional; never persist invalid cards. |

---

*End of PRD.*
