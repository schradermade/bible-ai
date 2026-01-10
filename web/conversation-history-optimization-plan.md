# Conversation History Optimization Plan

**Date:** January 9, 2026
**Status:** Ready to implement

## Problem Statement

Currently, the chat API sends unlimited conversation history to OpenAI with each request. This creates a cost vulnerability where long conversations (50+ messages) cost 7.5x more than normal requests.

### Current Costs (Unlimited History)
- Normal request (no history): $0.001726
- 50-message conversation: $0.012976 per request
- 100 paid users maxing out with long conversations: **$129.76/month**

## Solution: Sliding Window with Summarization (Option 2)

Keep recent messages in full detail + compress older messages into a summary.

### Decisions Made

1. **Keep 25 recent messages in full detail**
   - Maintains excellent context for deep theological discussions
   - Prevents LLM from losing context mid-conversation
   - Reduces worst-case costs by **42%**

2. **Trigger summarization after 30 messages**
   - First 30 messages: Keep all in full detail
   - Message 31+: Summarize oldest 10 messages, keep 20+ recent
   - Re-summarize every 10-15 messages as conversation grows

3. **Persist conversations to database** ✅
   - Allows multi-day/multi-week theological discussions
   - Enables "My Conversations" feature
   - Future-proofs for conversation search, sharing, year-end reports
   - Storage cost is negligible (~500 MB for 1000 users)

4. **Structured summary approach**
   - Key topics discussed
   - Scriptures referenced ([[Matthew 18:21-22]])
   - Prayer needs mentioned ({{anxiety about job}})
   - Current conversation thread

### Cost Impact

**With 25 Message Limit + Summary:**
- 50-message conversation: $0.007471 per request (vs $0.012976 unlimited)
- 100 paid users maxing out: **$74.71/month** (vs $129.76)
- **Savings: $55.05/month** (42% reduction)

## Implementation Architecture

### How It Works

```
Message Flow:
┌─────────────────────────────────────────────────┐
│ System Prompt (18K chars)                       │
├─────────────────────────────────────────────────┤
│ Conversation Summary (compressed old context)   │
│ "User asked about forgiveness in Matthew 18.    │
│  Discussed parable of unforgiving servant.       │
│  Prayer needs: {{workplace conflict healing}}.  │
│  Then explored Romans 12:18 on living at peace."│
├─────────────────────────────────────────────────┤
│ Message 21: User: "What about Romans 12:18?"    │
│ Message 22: Assistant: "[[Romans 12:18]]..."    │
│ Message 23: User: "How do I apply this?"        │
│ ...                                              │
│ Message 45: User: "Tell me more about peace"    │ ← Current
└─────────────────────────────────────────────────┘

Summary = Messages 1-20 compressed
Recent = Messages 21-45 in full detail
```

### Summarization Trigger Logic

```typescript
if (conversation.messages.length > 30) {
  // Need summarization
  const messagesToSummarize = conversation.messages.slice(0, -25);
  const recentMessages = conversation.messages.slice(-25);

  // Generate/update summary from old messages
  if (!conversation.summary || needsUpdate) {
    conversation.summary = await generateSummary(messagesToSummarize);
  }

  // Send to OpenAI: [systemPrompt, summary, ...recentMessages]
}
```

### Database Schema

```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String?  // Auto-generate: "Conversation about Forgiveness"
  summary   String?  @db.Text  // Compressed history
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  Message[]

  @@index([userId, createdAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // "user" or "assistant"
  content        String       @db.Text
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}
```

### Summary Generation Prompt

```typescript
const SUMMARIZATION_PROMPT = `You are summarizing a theological conversation between a user and Berea AI (a Bible study companion).

Given the conversation history below, create a concise but comprehensive summary that captures:

1. Key theological topics discussed
2. Scripture references mentioned (use [[bracket format]])
3. Prayer needs identified (use {{curly brace format}})
4. The conversation's progression and current thread

Keep the summary under 800 tokens. Focus on information the LLM needs to maintain coherent context.

Format:
Topics: [list key themes]
Scriptures: [references discussed]
Prayer Needs: [needs mentioned]
Thread: [narrative of conversation flow]`;
```

### API Endpoints to Create/Modify

#### 1. Create new conversation
```
POST /api/conversations
Body: { title?: string }
Returns: { id, userId, title, createdAt }
```

#### 2. Get user's conversations
```
GET /api/conversations
Returns: [{ id, title, updatedAt, messageCount }]
```

#### 3. Get specific conversation
```
GET /api/conversations/[id]
Returns: { id, title, summary, messages: [...] }
```

#### 4. Delete conversation
```
DELETE /api/conversations/[id]
Returns: { success: true }
```

#### 5. Modified chat endpoint
```
POST /api/ai/chat
Body: {
  query: string,
  conversationId?: string  // If continuing existing conversation
}
Returns: Stream response
Side effect: Saves message to conversation, triggers summarization if needed
```

### Frontend Changes

#### 1. Add Conversation Selector
- Sidebar or dropdown showing "My Conversations"
- "New Conversation" button
- Show conversation title + last updated

#### 2. Chat Component Updates
- Track current `conversationId` in state
- Load conversation history on mount
- Display conversation title
- "Delete Conversation" option

#### 3. Auto-generate Conversation Titles
- Use first user message (truncated to 50 chars)
- Or use LLM to generate: "Conversation about Forgiveness in Matthew 18"

## Implementation Phases

### Phase 1: Database Setup
- [ ] Create Prisma schema for Conversation + Message models
- [ ] Generate and run migration
- [ ] Test basic CRUD operations

### Phase 2: API Endpoints
- [ ] POST /api/conversations (create)
- [ ] GET /api/conversations (list)
- [ ] GET /api/conversations/[id] (get one)
- [ ] DELETE /api/conversations/[id] (delete)
- [ ] Build summarization utility function

### Phase 3: Modify Chat Endpoint
- [ ] Accept `conversationId` parameter
- [ ] Load existing messages if continuing conversation
- [ ] Implement 25-message sliding window logic
- [ ] Trigger summarization when > 30 messages
- [ ] Save user message and assistant response to DB

### Phase 4: Frontend UI
- [ ] Add "My Conversations" section
- [ ] Conversation selector/switcher
- [ ] Load conversation on selection
- [ ] "New Conversation" button
- [ ] Delete conversation confirmation

### Phase 5: Polish
- [ ] Auto-generate conversation titles
- [ ] Show message count / last updated
- [ ] Add loading states
- [ ] Handle edge cases (deleted conversations, etc.)

## Key Files to Modify

1. `prisma/schema.prisma` - Add Conversation + Message models
2. `src/app/api/conversations/route.ts` - New file (list/create)
3. `src/app/api/conversations/[id]/route.ts` - New file (get/delete)
4. `src/app/api/ai/chat/route.ts` - Modify to use conversations
5. `src/lib/summarization.ts` - New utility for generating summaries
6. `src/components/Dashboard.tsx` - Add conversation UI
7. `src/components/ConversationSelector.tsx` - New component

## Questions to Answer During Implementation

1. Should we auto-create a conversation on first message, or require explicit creation?
2. How long to keep conversations before auto-deletion? (Never? 6 months? 1 year?)
3. Should users be able to rename conversations?
4. Should we show typing indicator "Berea is typing..." during streaming?
5. Export conversation feature? (Share, PDF download, etc.)

## Success Metrics

- Worst-case monthly cost reduced from $129.76 to $74.71 (42% savings)
- Users can have 30+ message conversations without context loss
- Conversations persist across sessions/days/weeks
- Foundation for future features (search, sharing, year-end reports)

---

## Ready to Implement Tomorrow

All decisions made. Ready to start with Phase 1 (Database Setup).
