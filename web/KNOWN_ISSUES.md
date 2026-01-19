# Known Issues & Solutions

This document tracks technical issues, their root causes, and solutions for long-term reference.

---

## Issue #1: OpenAI Content Filter Blocking Bible Verses

**Status:** Identified, Investigating Solutions
**Date Discovered:** 2026-01-19
**Severity:** High (blocks core feature intermittently)

### Symptoms
- Collaborative study generation fails intermittently with JSON parse errors
- Error message: "Unterminated string in JSON at position XXXX"
- Truncation occurs mid-sentence, mid-verse
- Truncation length varies (observed at 2721 chars and 5713 chars)
- Not consistent - sometimes works, sometimes fails with identical inputs

### Root Cause
OpenAI's content moderation system returns `finish_reason: 'content_filter'` when generating Bible study content. The filter is incorrectly flagging legitimate biblical content as problematic and stopping generation mid-stream.

**Evidence:**
```
[API] Finish reason: content_filter
[API] Usage: {"prompt_tokens":609,"completion_tokens":627,"total_tokens":1236}
```
- Total tokens: 1,236 (out of 12,000 allowed) - not a token limit issue
- Both observed failures ended while generating Hebrews 10:24-25
- The verse content: "...not neglecting to meet together, as is the habit of some, but encouraging one another..."

### Investigation Steps Taken
1. Initial hypothesis: Token limit exceeded
   - Ruled out: Usage stats show only 1,236 tokens used of 12,000 allowed
2. Second hypothesis: Response buffer/streaming limit
   - Ruled out: Truncation points vary (2721, 5713 chars)
3. Added diagnostic logging to capture:
   - Prompt length and token estimates
   - OpenAI finish_reason
   - Token usage breakdown
   - Response length
4. Confirmed: `finish_reason: 'content_filter'` is the actual cause

### Potential Solutions

#### Option 1: Contact OpenAI Support (Recommended Long-Term)
**Approach:** Request accommodation for educational/pastoral use case
**Pros:**
- Addresses root cause
- Potentially prevents all future false positives
**Cons:**
- Unclear if OpenAI offers per-API-key whitelisting
- May take time to resolve
- No guarantee of accommodation
**Action Items:**
- [ ] Contact OpenAI Support
- [ ] Explain legitimate pastoral education use case
- [ ] Request adjustment to content filtering for Bible study content
- [ ] Ask about different content policy tiers or account settings

#### Option 2: Strengthen System Prompt
**Approach:** Make educational/pastoral context more explicit in API calls
**Pros:**
- Immediate implementation
- No external dependencies
**Cons:**
- May not fully prevent false positives
- Still at mercy of OpenAI's filter
**Implementation:**
```typescript
// Enhanced system prompt emphasizing educational context
content: 'You are a pastoral study designer creating educational Bible study content for a Christian small group platform. This is legitimate religious educational material.'
```

#### Option 3: Retry Logic on content_filter
**Approach:** Automatically retry generation when content_filter is triggered
**Pros:**
- Automatic recovery from intermittent failures
- Transparent to user
**Cons:**
- Band-aid solution, doesn't address root cause
- May fail again on retry
- Increases API costs
**Implementation:**
```typescript
if (finishReason === 'content_filter') {
  // Retry up to 2 times
  // Log the occurrence for monitoring
}
```

#### Option 4: Switch AI Provider
**Approach:** Move to different LLM provider (Anthropic, etc.)
**Pros:**
- Different content policies
- Potentially better handling of religious content
**Cons:**
- Significant development work
- May have other issues
- Migration costs

### Current Mitigation
- None (users see error and must manually retry)

### Chosen Solution
- TBD (pending decision)

### Related Files
- `/src/app/api/ai/generate-collaborative-study/route.ts` (lines 250-370)

### Notes
- This is a false positive - Hebrews 10:24-25 contains nothing objectionable
- The filter appears to over-trigger on religious content in general
- OpenAI should not be filtering Bible verses in educational contexts

---

## Template for Future Issues

**Status:** [Identified / In Progress / Resolved / Won't Fix]
**Date Discovered:** YYYY-MM-DD
**Severity:** [Critical / High / Medium / Low]

### Symptoms
- What users/developers observe
- Error messages
- Reproduction steps

### Root Cause
- Technical explanation of what's actually wrong
- Evidence supporting this diagnosis

### Investigation Steps Taken
1. Step by step of how we diagnosed this
2. Include what we ruled out and why

### Potential Solutions
#### Option 1: [Name]
**Approach:** Brief description
**Pros:**
- List benefits
**Cons:**
- List drawbacks
**Implementation:** Code snippets or steps

### Current Mitigation
- What's in place now (if anything)

### Chosen Solution
- What was decided and why

### Related Files
- File paths and relevant line numbers

### Notes
- Any other relevant context

---
