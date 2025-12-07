/**
 * VETAP Event - Invite Generator
 * 
 * Generates invitation files (PNG/PDF) from templates with QR codes
 */

import { generateQRBuffer } from './qr-generator';
import type { Template, Pass, Guest } from './types';

/**
 * Invite Generation Options
 */
export interface InviteGenerationOptions {
  format: 'png' | 'jpg' | 'pdf';
  quality?: number; // 1-100 for JPG, default: 90
  dpi?: number; // For PDF, default: 300
  includeGuestInfo?: boolean; // Add guest name/details on invite
}

/**
 * Template Image Data
 */
interface TemplateImageData {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'pdf';
}

/**
 * Load template image from storage
 */
async function loadTemplateImage(templateUrl: string): Promise<TemplateImageData> {
  try {
    // Fetch template from URL (Supabase Storage or external)
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Detect format from URL or content
    const format = templateUrl.toLowerCase().endsWith('.pdf') ? 'pdf' :
                   templateUrl.toLowerCase().endsWith('.jpg') || templateUrl.toLowerCase().endsWith('.jpeg') ? 'jpg' :
                   'png';
    
    // Get dimensions (requires sharp for images, pdf-lib for PDFs)
    let width = 0;
    let height = 0;
    
    if (format === 'pdf') {
      // PDF dimensions will be handled by pdf-lib
      width = 595; // A4 width in points (default)
      height = 842; // A4 height in points (default)
    } else {
      // Image dimensions using sharp
      const sharp = await import('sharp');
      const metadata = await sharp.default(buffer).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    }
    
    return { buffer, width, height, format };
  } catch (error) {
    console.error('Error loading template image:', error);
    throw new Error(`Failed to load template image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate QR code image buffer
 */
async function generateQRImage(
  qrPayload: string,
  size: number = 200
): Promise<Buffer> {
  return generateQRBuffer(qrPayload, {
    size,
    level: 'M',
    marginSize: 1,
  });
}

/**
 * Generate PNG/JPG invite
 */
async function generateImageInvite(
  template: Template,
  pass: Pass,
  guest: Guest,
  qrPayload: string,
  options: InviteGenerationOptions
): Promise<Buffer> {
  try {
    const sharp = await import('sharp');
    
    // Load template
    const templateData = await loadTemplateImage(template.base_file_url);
    
    if (templateData.format === 'pdf') {
      throw new Error('Cannot generate image invite from PDF template. Use PDF format instead.');
    }
    
    // Start with template image
    let image = sharp.default(templateData.buffer);
    
    // Get template dimensions for percentage to pixel conversion
    const templateWidth = templateData.width;
    const templateHeight = templateData.height;
    
    // Template stores positions as percentages (0-100), convert to pixels
    // Also handle legacy absolute pixel values (values > 100 are likely pixels)
    const isPercentage = (val: number) => val >= 0 && val <= 100;
    
    // Calculate QR size (percentage of template width or absolute pixels)
    const rawWidth = template.qr_width || 15; // Default 15%
    const rawHeight = template.qr_height || rawWidth; // Square by default
    
    const qrWidth = isPercentage(rawWidth) 
      ? Math.round((rawWidth / 100) * templateWidth)
      : Math.round(rawWidth);
    const qrHeight = isPercentage(rawHeight)
      ? Math.round((rawHeight / 100) * templateHeight)
      : Math.round(rawHeight);
    
    // Use the smaller dimension to keep QR square and scannable
    const qrSize = Math.min(qrWidth, qrHeight);
    const qrBuffer = await generateQRImage(qrPayload, qrSize);
    
    // Calculate QR position (percentage to pixels)
    const rawX = template.qr_position_x || 0;
    const rawY = template.qr_position_y || 0;
    
    const qrX = isPercentage(rawX)
      ? Math.round((rawX / 100) * templateWidth)
      : Math.round(rawX);
    const qrY = isPercentage(rawY)
      ? Math.round((rawY / 100) * templateHeight)
      : Math.round(rawY);
    
    console.log('QR Generation Debug:', {
      templateSize: { width: templateWidth, height: templateHeight },
      rawPosition: { x: rawX, y: rawY, width: rawWidth, height: rawHeight },
      calculatedPosition: { x: qrX, y: qrY, size: qrSize },
    });
    
    // Composite QR code onto template
    image = image.composite([
      {
        input: qrBuffer,
        left: qrX,
        top: qrY,
      },
    ]);
    
    // Add guest info if requested
    if (options.includeGuestInfo && guest.full_name) {
      // This would require text rendering - for now, we'll skip it
      // In production, you'd use a library like `canvas` or `sharp` with text overlay
      console.log('Guest info overlay not yet implemented');
    }
    
    // Export based on format
    if (options.format === 'jpg') {
      return await image
        .jpeg({ quality: options.quality || 90 })
        .toBuffer();
    } else {
      return await image
        .png()
        .toBuffer();
    }
  } catch (error) {
    console.error('Error generating image invite:', error);
    throw new Error(`Failed to generate image invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate PDF invite
 */
async function generatePDFInvite(
  template: Template,
  pass: Pass,
  guest: Guest,
  qrPayload: string,
  options: InviteGenerationOptions
): Promise<Buffer> {
  try {
    const PDFLib = await import('pdf-lib');
    const sharp = await import('sharp');
    
    // Load template
    const templateData = await loadTemplateImage(template.base_file_url);
    
    // Create PDF document
    const pdfDoc = await PDFLib.PDFDocument.create();
    
    let page;
    let pageWidth = 595; // A4 width in points
    let pageHeight = 842; // A4 height in points
    
    if (templateData.format === 'pdf') {
      // Load existing PDF template
      const existingPdf = await PDFLib.PDFDocument.load(templateData.buffer);
      const [firstPage] = existingPdf.getPages();
      const [copiedPage] = await pdfDoc.copyPages(existingPdf, [0]);
      page = copiedPage;
      pageWidth = copiedPage.getWidth();
      pageHeight = copiedPage.getHeight();
    } else {
      // Create new page and embed image
      page = pdfDoc.addPage([templateData.width, templateData.height]);
      pageWidth = templateData.width;
      pageHeight = templateData.height;
      
      // Embed template image
      let image;
      if (templateData.format === 'jpg') {
        image = await pdfDoc.embedJpg(templateData.buffer);
      } else {
        image = await pdfDoc.embedPng(templateData.buffer);
      }
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }
    
    // Template stores positions as percentages (0-100), convert to actual coordinates
    // Also handle legacy absolute pixel values (values > 100 are likely pixels)
    const isPercentage = (val: number) => val >= 0 && val <= 100;
    
    // Calculate QR size (percentage of page width or absolute pixels)
    const rawWidth = template.qr_width || 15; // Default 15%
    const rawHeight = template.qr_height || rawWidth; // Square by default
    
    const qrWidth = isPercentage(rawWidth) 
      ? Math.round((rawWidth / 100) * pageWidth)
      : Math.round(rawWidth);
    const qrHeight = isPercentage(rawHeight)
      ? Math.round((rawHeight / 100) * pageHeight)
      : Math.round(rawHeight);
    
    // Use the smaller dimension to keep QR square and scannable
    const qrSize = Math.min(qrWidth, qrHeight);
    const qrBuffer = await generateQRImage(qrPayload, qrSize);
    
    // Convert QR to PNG for embedding
    const qrPng = await sharp.default(qrBuffer).png().toBuffer();
    const qrImage = await pdfDoc.embedPng(qrPng);
    
    // Calculate QR position (percentage to actual coordinates)
    // PDF coordinates: bottom-left is origin, so we need to flip Y
    const rawX = template.qr_position_x || 0;
    const rawY = template.qr_position_y || 0;
    
    const qrX = isPercentage(rawX)
      ? Math.round((rawX / 100) * pageWidth)
      : Math.round(rawX);
    
    // For Y: convert percentage from top-left to PDF's bottom-left coordinate system
    const qrYFromTop = isPercentage(rawY)
      ? Math.round((rawY / 100) * pageHeight)
      : Math.round(rawY);
    const qrY = pageHeight - qrYFromTop - qrSize;
    
    console.log('PDF QR Generation Debug:', {
      pageSize: { width: pageWidth, height: pageHeight },
      rawPosition: { x: rawX, y: rawY, width: rawWidth, height: rawHeight },
      calculatedPosition: { x: qrX, y: qrY, size: qrSize },
    });
    
    // Draw QR code on PDF
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    // Add guest info if requested
    if (options.includeGuestInfo && guest.full_name) {
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      
      page.drawText(guest.full_name, {
        x: 50,
        y: pageHeight - 50,
        size: 24,
        font: font,
      });
      
      if (guest.email) {
        page.drawText(guest.email, {
          x: 50,
          y: pageHeight - 80,
          size: 12,
          font: font,
        });
      }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating PDF invite:', error);
    throw new Error(`Failed to generate PDF invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate invite file
 * @param template - Template object
 * @param pass - Pass object
 * @param guest - Guest object
 * @param qrPayload - QR code payload
 * @param options - Generation options
 * @returns Buffer of generated invite file
 */
export async function generateInviteFile(
  template: Template,
  pass: Pass,
  guest: Guest,
  qrPayload: string,
  options: InviteGenerationOptions
): Promise<Buffer> {
  if (options.format === 'pdf') {
    return generatePDFInvite(template, pass, guest, qrPayload, options);
  } else {
    return generateImageInvite(template, pass, guest, qrPayload, options);
  }
}

/**
 * Get file extension from format
 */
export function getFileExtension(format: 'png' | 'jpg' | 'pdf'): string {
  return format;
}

/**
 * Get MIME type from format
 */
export function getMimeType(format: 'png' | 'jpg' | 'pdf'): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    case 'pdf':
      return 'application/pdf';
  }
}

