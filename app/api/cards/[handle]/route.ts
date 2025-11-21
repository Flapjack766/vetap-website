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

async function writeData(data: any) {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(DATA_PATH, json, 'utf8');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const db = await readData();
  const item = db[handle];
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  // very simple credential gate: expects headers x-user and x-pass
  const user = req.headers.get('x-user') || '';
  const pass = req.headers.get('x-pass') || '';
  if (!(user === 'moh' && pass === 'Aa@05524409044.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incoming = await req.json();
  const db = await readData();
  db[handle] = incoming;
  try {
    await writeData(db);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    // If filesystem is not writable (e.g. serverless), still return ok=false
    return NextResponse.json({ ok: false, error: 'Persist failed' }, { status: 200 });
  }
}


