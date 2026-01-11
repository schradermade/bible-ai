# Study Plan Feature Testing Guide

## Prerequisites
- Dev server running on http://localhost:3000
- User must be signed in (Clerk authentication required)

## Test Endpoints

### 1. GET Study Plans (List active plan and stats)
```bash
# Open browser console while signed in to your app and run:
fetch('/api/study-plans', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "activePlan": null,
  "stats": {
    "totalCompleted": 0,
    "totalDaysStudied": 0,
    "currentStreak": 0,
    "longestStreak": 0
  }
}
```

### 2. POST Create Study Plan (Template)
```bash
# Create a 7-day Grace study plan
fetch('/api/study-plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'template_grace',
    duration: 7
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Available Templates:**
- `template_grace` - Understanding Grace
- `template_gospel` - The Gospel
- `template_prayer_fasting` - Prayer & Fasting
- `template_love_compassion` - Love & Compassion
- `template_faith_action` - Faith in Action

**Duration Options:** `7` or `21` days

### 3. PATCH Update Day Progress
```bash
# First, get your plan ID from the previous response
# Then mark day 1 as complete:
fetch('/api/study-plans/YOUR_PLAN_ID/progress', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dayNumber: 1,
    completed: true
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "day": { /* updated day object */ },
  "progress": {
    "completedDays": 1,
    "totalDays": 7,
    "percentComplete": 14,
    "engagementScore": 5
  },
  "streak": {
    "currentStreak": 1,
    "longestStreak": 1,
    "newMilestone": null
  }
}
```

### 4. PATCH with Engagement Tracking
```bash
# Mark day complete AND track engagement (verse saved, prayer generated)
fetch('/api/study-plans/YOUR_PLAN_ID/progress', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dayNumber: 2,
    completed: true,
    engagement: {
      verseSaved: true,
      prayerGenerated: true,
      chatEngaged: false
    }
  })
})
  .then(r => r.json())
  .then(console.log)
```

### 5. Test Streak Calculation
```bash
# Complete day 2 (consecutive day - should increment streak)
# Wait until tomorrow and complete day 3 (should increment to 3)
# Skip a day and complete day 4 (should reset streak to 1)

# To test same-day completion (shouldn't increment):
# Complete day 1, then uncheck and re-check same day
```

**Milestone Thresholds:**
- 3 days: "Building Momentum" 🌱
- 7 days: "Week of Devotion" 🔥
- 14 days: "Two Weeks Strong" 💪
- 21 days: "Three Weeks Faithful" ⭐
- 30 days: "Month of Faithfulness" 🏆

### 6. DELETE Study Plan
```bash
fetch('/api/study-plans/YOUR_PLAN_ID', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

## Testing Scenarios

### Scenario 1: Basic Flow
1. Create a 7-day Grace plan
2. Complete day 1 (streak: 1)
3. Complete day 2 same day (streak: still 1)
4. Check GET endpoint - should show activePlan with 2/7 days complete
5. Complete remaining days
6. Check GET endpoint - plan should be marked "completed"

### Scenario 2: Streak Testing
1. Create a new plan (delete previous first if exists)
2. Complete day 1 today (streak: 1)
3. Simulate tomorrow by manually updating `lastCompletedAt` in database
4. Complete day 2 (streak: should be 2)
5. Simulate skipping 2 days
6. Complete day 3 (streak: should reset to 1)

### Scenario 3: Engagement Score
1. Create plan
2. Complete day 1 with no engagement (score: 40/100 = 40%)
3. Complete day 2 with all engagement (score: 100/100 = 100%)
4. Check overall engagement score

### Scenario 4: Conflict Testing
1. Create a plan
2. Try to create another plan (should get 409 error)
3. Delete first plan
4. Create new plan (should succeed)

## Database Inspection

Check data directly in database:
```sql
-- View all study plans
SELECT * FROM "StudyPlan" WHERE "userId" = 'your_user_id';

-- View plan days
SELECT * FROM "StudyPlanDay" WHERE "studyPlanId" = 'your_plan_id' ORDER BY "dayNumber";

-- View streak stats
SELECT * FROM "StudyStreak" WHERE "userId" = 'your_user_id';
```

## Expected Behaviors

### ✅ What Should Work:
- Creating 7-day and 21-day plans from any template
- Single active plan enforcement (409 error if trying to create second)
- Streak calculation (consecutive days, reset on skip, no double-count same day)
- Progress tracking (completed days, engagement score)
- Milestone detection at specific thresholds
- Soft delete (plan preserved in DB with `deletedAt`)
- Plan completion (status changes to "completed" when all days done)

### ⏳ Not Yet Implemented (Coming Next):
- AI-personalized plan generation
- Achievement system
- Frontend widget UI
- Milestone celebrations UI
- Progress visualization

## Browser Console Quick Test

Paste this into browser console (while signed in):

```javascript
// Test complete flow
async function testStudyPlan() {
  console.log('1. Creating 7-day Grace plan...');
  const create = await fetch('/api/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'template_grace', duration: 7 })
  }).then(r => r.json());
  console.log('Created:', create);

  const planId = create.plan.id;

  console.log('2. Completing day 1...');
  const day1 = await fetch(`/api/study-plans/${planId}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayNumber: 1, completed: true })
  }).then(r => r.json());
  console.log('Day 1:', day1);

  console.log('3. Getting updated plan...');
  const get = await fetch('/api/study-plans').then(r => r.json());
  console.log('Plan status:', get);

  return { planId, create, day1, get };
}

// Run test
testStudyPlan().then(result => console.log('Test complete!', result));
```

This will create a plan, complete day 1, and show the updated stats!
