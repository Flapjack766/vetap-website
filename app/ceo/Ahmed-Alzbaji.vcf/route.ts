import { NextResponse } from 'next/server';

const LINES = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Alzbaji;Ahmed;;;',
  'FN:Ahmed Alzbaji',
  'ORG:VETAP',
  'TITLE:Founder & CEO',
  'EMAIL;TYPE=INTERNET,PREF:Ahmed@vetaps.com',
  'EMAIL;TYPE=INTERNET:ceo@vetaps.com',
  'TEL;TYPE=CELL,VOICE:+905346146038',
  'URL:https://www.vetaps.com',
  'X-SOCIALPROFILE;TYPE=x:https://x.com/ahmedalzbaji',
  'X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/ictfe',
  'X-SOCIALPROFILE;TYPE=snapchat:https://www.snapchat.com/add/hmood-az',
  'NOTE:Founder and CEO of VETAP',
  'END:VCARD',
];

export async function GET() {
  const body = LINES.join('\r\n'); // CRLF for compatibility
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'inline; filename="Ahmed-Alzbaji.vcf"',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

