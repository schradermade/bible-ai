# Minimal Backlog (V1)

## 1. Purpose
Translate V1 scope into a minimal set of epics and first stories.

---

## 2. Epics

### Epic A: Core Platform
- A1. User authentication (email + password)
- A2. Basic user profile and session handling
- A3. App shell and navigation

### Epic B: Scripture Reader
- B1. Scripture data integration (read-only)
- B2. Chapter navigation and verse selection
- B3. Highlights and basic notes

### Epic C: AI Orchestration
- C1. Server-side AI routing by feature
- C2. Prompt versioning and logging
- C3. Guardrails enforcement (tone, forbidden patterns)

### Epic D: AI UX Surfaces
- D1. Guided AI entry on home
- D2. Verse explanation flow from reader
- D3. Life discernment flow
- D4. Encouragement flow
- D5. Prophecy introduction flow
- D6. Journaling (light, AI-assisted)

### Epic E: Persistence
- E1. Save AI responses
- E2. Saved items list
- E3. Journal entries storage

---

## 3. First Stories (Suggested Start)

- Create onboarding screen with AI framing and limits
- Implement guided AI entry options on home
- Build verse selection and “Explain this” entry point
- Implement server endpoint for AI requests with feature routing
- Save AI responses and show in a basic list

---

## 4. Dependencies

- Scripture data source selection
- AI model/provider selection
- Authentication provider selection

---

## 5. Exit Criteria for V1

- At least one end-to-end AI flow works (input → response → save)
- Reader supports passage selection and explanation
- AI responses comply with behavior spec
- Users can create and sign in to accounts

