# Technical Architecture

## 1. Purpose

This document defines the high-level technical architecture and guiding constraints for the product.

It exists to:

- ensure consistent system design as the product grows
- protect AI guardrails and theological constraints
- keep web-first decisions aligned with future mobile needs
- clarify data boundaries and security expectations

---

## 2. Goals

- Web-first system with a clean API boundary for future mobile clients
- Centralized AI orchestration and guardrails on the server
- Clear separation between product features and AI behavior rules
- Strong privacy posture for user notes and journals

---

## 3. Non-Goals

- Mobile app implementation details
- Vendor-specific infrastructure decisions
- Detailed UI architecture or component design

---

## 4. System Overview

- Web client renders the primary experience
- Backend API handles authentication, data, and AI orchestration
- AI requests are routed through a server-side prompt system
- Guardrails and behavior checks are enforced server-side

---

## 5. Core Data Domains

- Users
- Scripture references and reading history
- Notes and highlights
- Journal entries
- AI interaction logs (sanitized and policy-compliant)

---

## 6. AI Architecture & Boundaries

- Prompts are defined and versioned on the server
- Each feature has its own AI contract and response structure
- Guardrails are enforced before AI output is returned to users
- No direct client-to-AI calls
- AI responses must comply with `docs/AI_UX_BEHAVIOR_SPEC.md`

---

## 7. Security & Privacy

- Journal entries and personal reflections are treated as sensitive data
- Encryption at rest is required for journals
- Access controls separate personal content from public data
- AI logging must avoid storing sensitive user content unless required for safety and quality

---

## 8. Mobile-Forward Constraints

- API-first design with stable, versioned endpoints
- AI workflows exposed as server-side capabilities, not client logic
- UX should tolerate short mobile sessions without degrading long-form web workflows

---

## 9. Operational Considerations

- AI usage monitoring and rate limits
- Auditability for AI behavior changes
- Feature flags for staged rollouts

