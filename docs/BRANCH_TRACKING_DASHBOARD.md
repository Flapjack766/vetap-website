# Branch Tracking Dashboard Documentation

## Overview

The Branch Tracking Dashboard allows users with approved access to manage their businesses, branches, and NFC cards. This dashboard is accessible at `/dashboard/tracking` for users who have been approved for branch tracking access.

## Access Control

Users must:
1. Submit a request for branch tracking dashboard access
2. Wait for admin approval
3. Once approved, they can access `/dashboard/tracking`

## Dashboard Structure

The dashboard is organized into three main tabs:

### 1. Businesses Tab (المنشآت)

**Features:**
- View all businesses owned by the user
- Add new business
- Select a business to manage its branches

**Business Form Fields:**
- Business Name (required)
- Industry (optional)
- Country (optional)
- City (optional)
- Custom Slug (optional)

**Navigation:**
- Click on a business card to select it and move to Branches tab

### 2. Branches Tab (الفروع)

**Features:**
- View all branches for the selected business
- Add new branch
- Select a branch to manage its NFC cards

**Branch Form Fields:**
- Branch Name (required)
- City (optional)
- District (optional)
- Address (optional)
- Latitude (optional)
- Longitude (optional)
- Google Maps URL (optional)
- Google Place ID (optional)

**Navigation:**
- Click on a branch card to select it and move to NFC Cards tab

**Note:** The Branches tab is disabled until a business is selected.

### 3. NFC Cards Tab (الكروت)

**Features:**
- View all NFC cards for the selected branch
- Add new NFC card
- View linked tracking links
- Generate new tracking link (coming soon)

**NFC Card Form Fields:**
- Card Label (required) - e.g., "Cashier Card 1"
- NFC UID (optional) - Unique card identifier
- Tracking Link ID (optional) - Link to an existing tracking link

**Navigation:**
- Cards show their linked tracking links if available
- "Generate New Link" button (coming soon) will create a tracking link for the card

**Note:** The NFC Cards tab is disabled until a branch is selected.

## User Flow

```
1. User opens /dashboard/tracking
   ↓
2. Businesses Tab (default)
   - View businesses
   - Add new business
   - Click business → Selects business, moves to Branches tab
   ↓
3. Branches Tab
   - View branches for selected business
   - Add new branch
   - Click branch → Selects branch, moves to NFC Cards tab
   ↓
4. NFC Cards Tab
   - View NFC cards for selected branch
   - Add new card
   - Generate tracking link (coming soon)
```

## API Integration

All operations use Supabase client-side queries with RLS (Row Level Security) policies:

- **Businesses**: Users can only see/modify their own businesses
- **Branches**: Users can only see/modify branches of their own businesses
- **NFC Cards**: Users can only see/modify cards of their own branches

## Future Enhancements

1. **Map Integration**: 
   - Interactive map for selecting branch location
   - Automatic lat/lng extraction from map clicks

2. **Tracking Link Generation**:
   - Direct link creation from NFC Cards tab
   - Template selection for intermediate pages
   - Destination URL configuration

3. **Analytics Integration**:
   - View tracking events for each card
   - Performance metrics per branch
   - Click-through rates

4. **Bulk Operations**:
   - Import businesses/branches from CSV
   - Bulk card creation
   - Export data

## File Structure

```
app/[locale]/dashboard/tracking/
└── page.tsx                    # Main page with auth check

app/(components)/dashboard/tracking/
├── BranchTrackingDashboard.tsx # Main dashboard component
└── tabs/
    ├── BusinessesTab.tsx        # Businesses management
    ├── BranchesTab.tsx          # Branches management
    └── NFCCardsTab.tsx          # NFC Cards management
```

## Testing

1. **Create a Business:**
   - Click "Add Business"
   - Fill in the form
   - Submit
   - Verify business appears in list

2. **Create a Branch:**
   - Select a business
   - Click "Add Branch"
   - Fill in location details
   - Submit
   - Verify branch appears in list

3. **Create an NFC Card:**
   - Select a branch
   - Click "Add Card"
   - Fill in card details
   - Submit
   - Verify card appears in list

## RTL Support

The dashboard fully supports RTL (Right-to-Left) for Arabic locale:
- Text alignment
- Button positioning
- Form layouts
- Navigation flow

## Error Handling

All operations include:
- Loading states
- Error messages via toast notifications
- Form validation
- Graceful fallbacks for empty states

