import { NextResponse } from 'next/server';

// Redirect old vcard path to new one
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(new URL('/ceo/Ahmed-Alzbaji.vcf', origin), 301);
}

