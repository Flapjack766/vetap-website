# Tracking Templates Documentation

## Overview

The tracking templates system allows businesses to display custom intermediate pages before redirecting users to their final destination (Google Maps, restaurant page, menu, etc.).

## Template Structure

Templates are organized in two main categories:

```
app/(components)/tracking/
├── restaurant-templates/
│   ├── RestaurantTemplate1.tsx
│   ├── RestaurantTemplate2.tsx (future)
│   └── ...
└── menu-templates/
    ├── MenuTemplate1.tsx
    ├── MenuTemplate2.tsx (future)
    └── ...
```

## Current Templates

### Restaurant Templates

#### RestaurantTemplate1 - Classic
- **Style**: Clean, professional design with hero image
- **Features**:
  - Cover image with logo overlay
  - Business name and branch name
  - Address display
  - Operating hours
  - Contact buttons (Phone, WhatsApp)
  - Google Maps review button
  - Continue to destination button

### Menu Templates

#### MenuTemplate1 - Simple Menu Display
- **Style**: Focused on menu presentation
- **Features**:
  - Header with logo and business name
  - Full menu image support
  - Menu items list with images, descriptions, and prices
  - Address and operating hours
  - Contact buttons
  - Google Maps review button
  - Continue to destination button

## Template Props

### RestaurantTemplateProps

```typescript
interface RestaurantTemplateProps {
  // Business Info
  businessName: string;
  branchName?: string;
  
  // Images
  logo?: string;
  coverImage?: string;
  
  // Contact Info
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  
  // Operating Hours
  operatingHours?: {
    [key: string]: string; // e.g., { "Monday": "9:00 AM - 10:00 PM" }
  } | string; // Or simple string like "Daily: 9 AM - 10 PM"
  
  // CTA
  destinationUrl: string;
  onContinue: () => void;
  
  // Optional
  description?: string;
  address?: string;
}
```

### MenuTemplateProps

```typescript
interface MenuTemplateProps {
  // Same as RestaurantTemplateProps, plus:
  
  // Menu
  menuItems?: Array<{
    name: string;
    description?: string;
    price?: string;
    image?: string;
    category?: string;
  }>;
  menuImage?: string; // Full menu image
}
```

## Adding New Templates

### Step 1: Create Template Component

Create a new file in the appropriate directory:

```typescript
// app/(components)/tracking/restaurant-templates/RestaurantTemplate2.tsx

'use client';

import { RestaurantTemplateProps } from './RestaurantTemplate1';

export function RestaurantTemplate2(props: RestaurantTemplateProps) {
  // Your template implementation
  return (
    <div>
      {/* Your template JSX */}
    </div>
  );
}
```

### Step 2: Export from Index

Add to `app/(components)/tracking/index.ts`:

```typescript
export { RestaurantTemplate2 } from './restaurant-templates/RestaurantTemplate2';
```

### Step 3: Register in Page Component

Update `app/r/[slug]/page.tsx` to include your new template:

```typescript
import { RestaurantTemplate2 } from '@/app/(components)/tracking/restaurant-templates/RestaurantTemplate2';

// In the template rendering logic:
if (isRestaurantTemplate) {
  const templateNumber = templateName.match(/\d+/)?.[0] || '1';
  
  if (templateNumber === '1') {
    return <RestaurantTemplate1 {...props} />;
  }
  if (templateNumber === '2') {
    return <RestaurantTemplate2 {...props} />;
  }
  // ... etc
}
```

## Template Naming Convention

Templates should follow this naming pattern:

- **Restaurant Templates**: `restaurant-template-1`, `restaurant-template-2`, etc.
- **Menu Templates**: `menu-template-1`, `menu-template-2`, etc.

The number in the template name is used to select the appropriate component.

## Data Flow

1. User visits `/r/[slug]`
2. `route.ts` logs the event and determines if intermediate page is needed
3. If needed, redirects to `page.tsx` with query params
4. `page.tsx` fetches link data from `/api/tracking/link-data`
5. Based on `selected_template`, renders appropriate template component
6. User clicks "Continue" → redirects to `destination_url`

## Template Selection Logic

The template is selected based on `tracking_links.selected_template`:

```typescript
const templateName = linkData.trackingLink.selected_template || template;
const isMenuTemplate = templateName.includes('menu');
const isRestaurantTemplate = templateName.includes('restaurant');
const templateNumber = templateName.match(/\d+/)?.[0] || '1';
```

## Styling Guidelines

1. **Use Tailwind CSS**: All templates should use Tailwind utility classes
2. **Responsive Design**: Ensure templates work on mobile, tablet, and desktop
3. **Accessibility**: Use semantic HTML and proper ARIA labels
4. **Performance**: Optimize images with Next.js Image component
5. **Consistency**: Follow the design system established in existing templates

## Example: Creating RestaurantTemplate2

```typescript
'use client';

import { Button } from '@/app/(components)/ui/button';
import { RestaurantTemplateProps } from './RestaurantTemplate1';
import Image from 'next/image';

export function RestaurantTemplate2({
  businessName,
  branchName,
  logo,
  coverImage,
  phone,
  whatsapp,
  googleMapsUrl,
  operatingHours,
  destinationUrl,
  onContinue,
  description,
  address,
}: RestaurantTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Your custom design */}
      <div className="container mx-auto px-4 py-8">
        <h1>{businessName}</h1>
        {/* ... rest of your template */}
        <Button onClick={onContinue}>
          Continue to Destination
        </Button>
      </div>
    </div>
  );
}
```

## Future Templates to Create

### Restaurant Templates (5 total)
- ✅ RestaurantTemplate1 - Classic
- ⏳ RestaurantTemplate2 - Modern Card
- ⏳ RestaurantTemplate3 - Minimal
- ⏳ RestaurantTemplate4 - Elegant
- ⏳ RestaurantTemplate5 - Bold

### Menu Templates (5 total)
- ✅ MenuTemplate1 - Simple Menu Display
- ⏳ MenuTemplate2 - Grid Menu
- ⏳ MenuTemplate3 - Category Menu
- ⏳ MenuTemplate4 - Image Gallery Menu
- ⏳ MenuTemplate5 - Interactive Menu

## Testing Templates

1. Create a tracking link in the database:
```sql
INSERT INTO tracking_links (
  business_id, branch_id, slug, destination_type,
  destination_url, show_intermediate_page, selected_template
) VALUES (
  'business-uuid', 'branch-uuid', 'test123', 'google_maps_review',
  'https://maps.google.com/...', true, 'restaurant-template-1'
);
```

2. Visit the link: `http://localhost:3000/r/test123`

3. Verify the template renders correctly with all data

## Best Practices

1. **Always include onContinue handler**: Every template must have a way to continue to destination
2. **Handle missing data gracefully**: Use optional chaining and fallbacks
3. **Optimize images**: Use Next.js Image component with proper sizing
4. **Test on multiple devices**: Ensure responsive design works
5. **Follow accessibility guidelines**: Use proper semantic HTML
6. **Keep templates focused**: Each template should have a clear purpose and design

