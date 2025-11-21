import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'content', 'cards.json');

async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const db = await readData();
  const item = db[handle];
  const l = item?.en || item?.ar || item?.tr;
  if (!l) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${l.name}`,
    'ORG:Turkish Airlines',
    `TITLE:${l.rank}`,
    l.contacts?.email ? `EMAIL;TYPE=INTERNET,PREF:${l.contacts.email}` : '',
    l.contacts?.website ? `URL:${l.contacts.website}` : '',
    'END:VCARD',
  ].filter(Boolean);

  const body = lines.join('\r\n');
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="${handle}.vcf"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}


