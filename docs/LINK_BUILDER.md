# Link Builder Documentation

## Overview

The Link Builder is a comprehensive interface for creating and managing tracking links. It allows users to create unique short links that can be embedded in NFC cards or QR codes, with various destination types and customization options.

## Access

**Path:** `/dashboard/tracking/links`

**Requirements:**
- User must have approved branch tracking dashboard access
- User must be authenticated

## Features

### 1. Business & Branch Selection

- **Business Selection**: Choose from user's businesses
- **Branch Selection**: Choose from branches of selected business
- Dynamic loading: Branches load automatically when business is selected

### 2. Destination Types

#### Google Maps Review
- **Input**: Google Maps URL
- **Use Case**: Direct redirect to Google Maps review page
- **Example**: `https://maps.google.com/?cid=123456789`

#### Restaurant Page
- **Template Selection**: Choose from 5 restaurant templates
- **Template Data**:
  - Description
  - Cover Image URL
  - Logo URL
  - Operating Hours
- **Use Case**: Show intermediate page with restaurant info before redirect

#### Menu Page
- **Template Selection**: Choose from 5 menu templates
- **Template Data**:
  - Description
  - Cover Image URL
  - Logo URL
  - Operating Hours
  - Full Menu Image URL
  - Menu Items (can be added later)
- **Use Case**: Show menu page before redirect

#### Custom URL
- **Input**: Any valid URL
- **Use Case**: Redirect to any custom destination

### 3. Additional Options

#### Show Intermediate Page
- **Checkbox**: Enable/disable intermediate page
- **When Enabled**: Shows template-based page before redirect
- **When Disabled**: Direct redirect to destination

#### Collect Feedback First
- **Checkbox**: Enable/disable feedback collection
- **When Enabled**: Shows feedback form (rating + comment) before redirect
- **When Disabled**: No feedback collection

### 4. Link Creation

When the form is submitted:

1. **Slug Generation**: Automatically generates unique 6-character slug
2. **Link Creation**: Creates record in `tracking_links` table
3. **Success Display**: Shows:
   - Final URL: `https://vetaps.com/r/[slug]`
   - QR Code: Visual QR code for the link
   - Copy Button: Quick copy to clipboard

### 5. Card Linking

#### Automatic Linking
- If `card_id` is provided in URL query params, the created link is automatically linked to that card
- Example: `/dashboard/tracking/links?card_id=uuid-here`

#### Manual Linking
- In NFC Cards tab, users can:
  - Select existing tracking link from dropdown
  - Or create new link (navigates to Link Builder)

## Form Flow

```
1. Select Business
   ↓
2. Select Branch (enabled after business selection)
   ↓
3. Select Destination Type
   ↓
4. Fill Destination-Specific Fields:
   - Google Maps: Enter URL
   - Restaurant/Menu: Select template + fill template data
   - Custom: Enter URL
   ↓
5. Configure Options:
   - Show intermediate page?
   - Collect feedback first?
   ↓
6. Submit → Link Created
   ↓
7. View Result:
   - URL displayed
   - QR Code generated
   - Option to create new link
```

## API Integration

### Create Link Endpoint

**POST** `/api/tracking/create-link`

**Request Body:**
```typescript
{
  business_id: string;          // UUID
  branch_id: string;            // UUID
  destination_type: 'google_maps_review' | 'restaurant_page' | 'menu_page' | 'custom_url';
  destination_url?: string;      // Required for google_maps_review and custom_url
  selected_template?: string;    // Required for restaurant_page and menu_page
  show_intermediate_page: boolean;
  collect_feedback_first: boolean;
  template_data?: {
    description?: string;
    cover_image?: string;
    logo?: string;
    operating_hours?: string;
    menu_items?: Array<{...}>;
    menu_image?: string;
  };
}
```

**Response:**
```typescript
{
  success: true;
  slug: string;                 // 6-character unique slug
  id: string;                    // Tracking link UUID
  url: string;                   // Full URL: https://vetaps.com/r/[slug]
}
```

## QR Code Generation

- Uses `qrcode.react` library
- Dynamically imported (client-side only)
- Displays 200x200px QR code
- Contains full URL: `https://vetaps.com/r/[slug]`

## Slug Generation

- **Length**: 6 characters
- **Characters**: Lowercase letters (a-z) and numbers (0-9)
- **Uniqueness**: Automatically checks and regenerates if duplicate
- **Max Attempts**: 10 attempts before failing

## Template Data Storage

Currently, template data (description, images, etc.) is not stored in the database. This is a future enhancement. For now:

- Template data can be stored in:
  - A separate `template_data` JSONB column (if added to schema)
  - Or fetched from branch/business metadata when rendering

## Integration with NFC Cards

### From Link Builder
1. User creates link
2. If `card_id` in URL params → automatically links card
3. User can then go to NFC Cards tab to verify

### From NFC Cards Tab
1. User clicks "Generate New Link" on a card
2. Navigates to Link Builder with `?card_id=uuid`
3. After link creation, card is automatically linked
4. Or user can select existing link from dropdown

## Future Enhancements

1. **Template Data Storage**: Store template data in database
2. **Image Upload**: Direct image upload instead of URLs
3. **Menu Items Editor**: Visual editor for menu items
4. **Link Analytics**: View click statistics per link
5. **Bulk Link Creation**: Create multiple links at once
6. **Link Templates**: Save link configurations as templates
7. **Preview Mode**: Preview intermediate page before saving

## File Structure

```
app/[locale]/dashboard/tracking/links/
└── page.tsx                    # Page with auth check

app/(components)/dashboard/tracking/links/
└── LinkBuilder.tsx              # Main link builder component

app/api/tracking/
└── create-link/route.ts        # API route for link creation
```

## Testing

1. **Create Google Maps Link:**
   - Select business and branch
   - Choose "Google Maps Review"
   - Enter Google Maps URL
   - Submit
   - Verify URL and QR code appear

2. **Create Restaurant Page Link:**
   - Select business and branch
   - Choose "Restaurant Page"
   - Select template (1-5)
   - Fill template data
   - Enable "Show intermediate page"
   - Submit
   - Visit link and verify intermediate page shows

3. **Link to Card:**
   - Go to NFC Cards tab
   - Click "Generate New Link" on a card
   - Create link
   - Verify card is automatically linked
   - Go back to NFC Cards tab and verify link appears

