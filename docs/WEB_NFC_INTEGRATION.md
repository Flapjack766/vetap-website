# Web NFC Integration Documentation

## Overview

The Web NFC integration allows users to write tracking links directly to NFC cards from their browser, eliminating the need for external NFC writing apps.

## Features

### 1. QR Code Display
- Each NFC card with a linked tracking URL displays a QR code
- QR code can be scanned to access the tracking link
- Useful for testing and sharing links

### 2. Copy Link Button
- One-click copy of the full tracking URL
- Works on all browsers and devices
- Useful when Web NFC is not supported

### 3. Write to NFC
- Direct writing of tracking links to NFC cards
- Uses Web NFC API
- Only works on supported browsers/devices

### 4. Format NFC Card
- Clears/resets NFC card data
- Useful for reusing cards
- Only works on supported browsers/devices

## Browser Support

### Supported
- **Google Chrome** on Android 5.0+
- **Samsung Internet** on Android (partial support)
- Requires device with NFC hardware

### Not Supported
- iOS Safari (no NFC API)
- Desktop browsers (no NFC hardware)
- Firefox (no Web NFC support)
- Older Android browsers

## Implementation Details

### Web NFC API

The implementation uses the Web NFC API (`NDEFWriter`):

```typescript
const writer = new NDEFWriter();
await writer.write({
  records: [
    {
      recordType: 'url',
      data: 'https://vetaps.com/r/abc123',
    },
  ],
});
```

### Detection

The system automatically detects Web NFC support:

```typescript
if (typeof window !== 'undefined' && 'NDEFWriter' in window) {
  // Web NFC is supported
} else {
  // Web NFC is not supported
}
```

### User Experience

1. **Supported Browser/Device:**
   - "Write to NFC" and "Format Card" buttons are visible
   - User can write links directly to cards
   - Real-time feedback during writing

2. **Unsupported Browser/Device:**
   - Alert message explains limitations
   - Only "Copy Link" button is available
   - User can use external NFC writing apps

## Usage Flow

### Writing a Link to NFC Card

1. User selects an NFC card with a linked tracking URL
2. Clicks "Write to NFC" button
3. Browser prompts for NFC permission (first time only)
4. User brings NFC card close to phone
5. System writes the tracking URL to the card
6. Success/error message is displayed

### Formatting an NFC Card

1. User selects an NFC card
2. Clicks "Format Card" button
3. Browser prompts for NFC permission (if needed)
4. User brings NFC card close to phone
5. System clears the card data
6. Success/error message is displayed

## Error Handling

### Common Errors

1. **NFC Not Enabled:**
   - Error: "NFC is not enabled on this device"
   - Solution: Enable NFC in device settings

2. **Card Too Far:**
   - Error: "Failed to write. Make sure card is near the phone."
   - Solution: Bring card closer to phone

3. **Permission Denied:**
   - Error: "NFC permission denied"
   - Solution: Grant NFC permission in browser settings

4. **Unsupported Browser:**
   - Alert: Shows supported browsers/devices
   - Solution: Use Chrome on Android or copy link

## Security Considerations

1. **HTTPS Required:**
   - Web NFC API only works on HTTPS (or localhost)
   - Production sites must use SSL

2. **User Permission:**
   - Browser prompts user before accessing NFC
   - Permission is per-origin

3. **Data Validation:**
   - Only tracking URLs are written
   - No arbitrary data can be written

## Testing

### Test on Android

1. Use Chrome browser on Android 5.0+
2. Enable NFC in device settings
3. Navigate to NFC Cards page
4. Select a card with linked URL
5. Click "Write to NFC"
6. Bring NFC card close to phone
7. Verify link is written successfully

### Test QR Code

1. Scan QR code with any QR scanner app
2. Verify it opens the tracking link
3. Test on different devices

### Test Copy Link

1. Click "Copy Link" button
2. Paste in any app
3. Verify URL is correct

## Troubleshooting

### "Web NFC Not Supported" Alert

**Cause:** Browser or device doesn't support Web NFC

**Solutions:**
- Use Chrome on Android
- Ensure Android 5.0+
- Check NFC hardware is present
- Use "Copy Link" as alternative

### Writing Fails

**Causes:**
- NFC not enabled
- Card too far from phone
- Card is read-only
- Permission denied

**Solutions:**
- Enable NFC in settings
- Bring card closer
- Use writable NFC card
- Grant browser permissions

### QR Code Not Displaying

**Causes:**
- Card not linked to tracking URL
- JavaScript error

**Solutions:**
- Link card to a tracking link first
- Check browser console for errors

## Future Enhancements

1. **NFC Reading:**
   - Read existing data from cards
   - Verify written data

2. **Batch Writing:**
   - Write to multiple cards
   - Bulk operations

3. **Card Templates:**
   - Pre-configured card formats
   - Custom data structures

4. **Analytics Integration:**
   - Track which cards are written
   - Monitor write success rate

## Code Examples

### Writing URL to NFC

```typescript
const handleWriteToNFC = async (card: NFCCard) => {
  if (!card.tracking_link) return;
  
  const fullUrl = `${siteUrl}/r/${card.tracking_link.slug}`;
  const writer = new NDEFWriter();
  
  await writer.write({
    records: [
      {
        recordType: 'url',
        data: fullUrl,
      },
    ],
  });
};
```

### Formatting NFC Card

```typescript
const handleFormatNFC = async (card: NFCCard) => {
  const writer = new NDEFWriter();
  
  // Write empty records to clear card
  await writer.write({
    records: [],
  });
};
```

### Detecting Support

```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && 'NDEFWriter' in window) {
    setNfcSupported(true);
  } else {
    setNfcSupported(false);
  }
}, []);
```

## References

- [Web NFC Specification](https://w3c.github.io/web-nfc/)
- [Chrome Web NFC Guide](https://web.dev/nfc/)
- [MDN Web NFC API](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)

