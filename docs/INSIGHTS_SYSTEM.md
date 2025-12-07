# Insights System Documentation

## Overview

The Insights system provides intelligent analysis of tracking and review data, generating actionable recommendations and alerts based on simple rule-based logic.

## Features

### 1. Insight Types

- **Warning** (`warning`): Critical issues requiring attention
- **Success** (`success`): Positive trends and achievements
- **Suggestion** (`suggestion`): Recommendations for improvement
- **Info** (`info`): Informational insights

### 2. Priority Levels

- **High**: Urgent issues that need immediate attention
- **Medium**: Important but not urgent
- **Low**: Nice-to-know information

## Insight Rules

### Rule 1: Low Review Conversion Rate

**Trigger:** 
- Total clicks > 50
- New reviews < 10% of total clicks

**Message:**
```
"العملاء يصلون لصفحة التقييم لكن لا يتركون مراجعة. معدل التحويل الحالي: X%. 
جرّب تحفيزهم بعرض صغير أو رسالة ترحيبية."
```

**Type:** `suggestion`  
**Priority:** `high`

### Rule 2: Declining Ratings

**Trigger:**
- At least 2 review syncs
- Average rating dropped by > 0.3 stars in recent period

**Message:**
```
"تم رصد ارتفاع في التقييمات المنخفضة خلال الفترة من X إلى Y. 
المتوسط انخفض من A إلى B."
```

**Type:** `warning`  
**Priority:** `high`

### Rule 3: Low Activity

**Trigger:**
- Total clicks < 10
- Time range = 30 days

**Message:**
```
"عدد النقرات منخفض خلال آخر 30 يوم. تأكد من أن روابط NFC نشطة ومتاحة للعملاء."
```

**Type:** `info`  
**Priority:** `medium`

### Rule 4: High Conversion Rate

**Trigger:**
- Total clicks > 20
- New reviews > 20% of total clicks

**Message:**
```
"معدل تحويل ممتاز! X% من النقرات تحولت إلى تقييمات جديدة. استمر في العمل الجيد!"
```

**Type:** `success`  
**Priority:** `low`

### Rule 5: No Reviews Synced

**Trigger:**
- No review syncs found
- Total clicks > 0

**Message:**
```
"لا توجد بيانات تقييمات متزامنة. تأكد من ربط حساب Google Business Profile في الإعدادات."
```

**Type:** `warning`  
**Priority:** `high`

### Rule 6: Rating Improvement

**Trigger:**
- At least 2 review syncs
- Average rating increased by > 0.3 stars

**Message:**
```
"تحسن في التقييمات! المتوسط ارتفع من X إلى Y."
```

**Type:** `success`  
**Priority:** `low`

## API Endpoint

### GET `/api/tracking/insights`

**Query Parameters:**
```typescript
{
  business_id: string;        // Required: UUID
  time_range?: 'today' | '7days' | '30days';  // Default: '7days'
  branch_id?: string;         // Optional: UUID
}
```

**Response:**
```json
{
  "success": true,
  "insights": [
    {
      "type": "suggestion",
      "title": "Low Review Conversion Rate",
      "message": "...",
      "priority": "high",
      "data": {
        "clicks": 100,
        "newReviews": 5,
        "conversionRate": 5
      }
    }
  ],
  "summary": {
    "totalClicks": 100,
    "newReviews": 5,
    "conversionRate": 5,
    "averageRating": 4.5
  }
}
```

## Component Usage

```tsx
import { InsightsPanel } from '@/app/(components)/dashboard/tracking/analytics/InsightsPanel';

<InsightsPanel
  businessId={selectedBusinessId}
  branchId={selectedBranchId}  // Optional
  timeRange="7days"
/>
```

## Customization

### Adding New Rules

1. Add rule logic in `/api/tracking/insights/route.ts`
2. Create insight object with appropriate type and priority
3. Push to insights array

Example:
```typescript
// New rule: Sudden spike in clicks
if (totalClicks > previousPeriodClicks * 2) {
  insights.push({
    type: 'info',
    title: 'Traffic Spike',
    message: 'تم رصد زيادة كبيرة في النقرات مقارنة بالفترة السابقة.',
    priority: 'medium',
    data: {
      currentClicks: totalClicks,
      previousClicks: previousPeriodClicks,
    },
  });
}
```

### Modifying Thresholds

Edit the trigger conditions in the API route:

```typescript
// Change conversion threshold from 10% to 15%
if (totalClicks > 50 && newReviews < totalClicks * 0.15) {
  // ...
}

// Change rating decline threshold from 0.3 to 0.5
if (avgSecond < avgFirst - 0.5) {
  // ...
}
```

## Display Logic

Insights are automatically sorted by priority:
1. High priority first
2. Medium priority second
3. Low priority last

Within each priority level, insights maintain their original order.

## Styling

Each insight type has its own color scheme:
- **Warning**: Yellow border and background
- **Success**: Green border and background
- **Suggestion**: Blue border and background
- **Info**: Gray border and background

## Future Enhancements

1. **Machine Learning**: Replace rule-based logic with ML models
2. **Predictive Insights**: Forecast future trends
3. **Actionable Recommendations**: Specific steps to improve metrics
4. **A/B Testing Suggestions**: Recommendations for testing different approaches
5. **Competitor Comparison**: Compare metrics with industry averages
6. **Time-based Patterns**: Detect patterns (e.g., "Clicks peak on weekends")
7. **Geographic Insights**: Location-based recommendations
8. **Device-specific Insights**: Recommendations based on device type

## Performance Considerations

- Insights are calculated on-demand (not cached)
- For large datasets, consider caching insights for 5-10 minutes
- API response time typically < 500ms for normal datasets

## Testing

Test each rule with sample data:

```typescript
// Test low conversion
const testData = {
  clicks: 100,
  newReviews: 3,  // 3% conversion
};

// Test declining ratings
const testRatings = [4.5, 4.3, 4.1, 3.9, 3.7];  // Declining trend
```

