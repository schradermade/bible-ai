# Product Decisions Log

## 1. Purpose of This Log

This document records significant product, theological, architectural, and AI-related decisions.

Its purpose is to:

- preserve context
- prevent re-litigation of settled decisions
- document trade-offs
- protect long-term coherence

This is not a backlog or brainstorming space.
Only decisions that affect direction or constraints belong here.

---

## 2. Architectural Decisions

### [2026-01-XX] Web-First Architecture

**Decision**  
The product will launch as a web application before mobile.

**Rationale**  
Core features require long-form reading, reflection, and writing that are better suited to desktop environments. Mobile will be introduced later as a companion experience.

---

## 3. Product Scope Decisions

### [2026-01-XX] Exclusion of Community Features in Stage-1

**Decision**  
Community, comments, and social features are excluded from the initial release.

**Rationale**  
Theological discussion requires trust and moderation infrastructure. Trust must be earned before introducing social dynamics.

---

### [2026-01-XX] AI as a Core Feature from Day One

**Decision**  
AI will be a visible, central part of the product at launch.

**Rationale**  
Differentiation in a crowded Bible app market and the opportunity to introduce AI in a safe, meaningful context—especially for older users.

---

## 4. Theology & AI Decisions

### [2026-01-XX] AI Will Not Offer Personal Prophecy

**Decision**  
The AI will never offer personal prophecy or predictions.

**Rationale**  
Scripture does not support personal prophecy as a product feature, and such behavior would undermine trust and theological integrity.

---

### [2026-01-XX] Discernment Over Advice

**Decision**  
AI responses will guide reflection rather than give instructions.

**Rationale**  
The product exists to support discernment, not replace conscience, prayer, or wisdom.

---

## 5. Deferred Ideas

### [2026-01-XX] Real-Time News Interpretation

**Idea**  
Analyze current news events through a biblical lens.

**Reason for Deferral**  
High risk of sensationalism and misinterpretation. Requires stronger guardrails and user trust.

---

## 6. Rejected Ideas

### [2026-01-XX] Autonomous AI Interventions

**Idea**  
Allow AI to proactively interrupt users with insights or warnings.

**Reason for Rejection**  
Violates the principle of invitational, user-controlled engagement and risks overreach.

### [2026-01-04] AI UX Language Feature Brief

**Decision**  
Document AI UX language in a dedicated feature brief to enforce tone and safety consistency across all AI surfaces.

**Rationale**  
AI tone is a core differentiator and trust signal. A dedicated brief ensures consistent copy and safeguards.

**Reference**  
`docs/features/ai-ux-language.md`
