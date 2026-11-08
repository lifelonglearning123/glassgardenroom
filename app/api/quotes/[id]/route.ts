import { NextResponse } from 'next/server';
import { getQuote, saveQuote } from '@/lib/quotes';
import { RANGES, type Line, type Quote, type RangeKey } from '@/lib/quote';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const q = await getQuote((await params).id);
  return q ? NextResponse.json(q) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

/** Saves the editable parts of a quote. Status, number and link token cannot be changed here. */
export async function PUT(req: Request, { params }: Ctx) {
  const q = await getQuote((await params).id);
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = (await req.json()) as Partial<Quote>;

  if (b.client) {
    q.client = {
      ghlContactId: str(b.client.ghlContactId, 100) || undefined,
      name: str(b.client.name, 200),
      email: str(b.client.email, 200),
      phone: str(b.client.phone, 50),
      address: str(b.client.address, 300),
      postcode: str(b.client.postcode, 20),
    };
  }
  if (b.spec) {
    const range = (b.spec.range in RANGES ? b.spec.range : q.spec.range) as RangeKey;
    q.spec = {
      range,
      productName: str(b.spec.productName, 200),
      width: str(b.spec.width, 30),
      projection: str(b.spec.projection, 30),
      colour: str(b.spec.colour, 100),
      roof: str(b.spec.roof, 200),
      leftReturn: str(b.spec.leftReturn, 300),
      rightReturn: str(b.spec.rightReturn, 300),
      front: str(b.spec.front, 300),
      freestanding: Boolean(b.spec.freestanding),
      notes: str(b.spec.notes, 4000),
    };
  }
  if (b.pricing) {
    const p = b.pricing;
    q.pricing = {
      packageAmount: num(p.packageAmount),
      upgrades: (Array.isArray(p.upgrades) ? p.upgrades : []).slice(0, 30).map((l: Line) => ({
        id: str(l.id, 50) || crypto.randomUUID(),
        label: str(l.label, 200),
        amount: num(l.amount),
      })),
      installMode: p.installMode === 'diy' ? 'diy' : 'professional',
      installAmount: num(p.installAmount),
      installNote: str(p.installNote, 300),
      discountLabel: str(p.discountLabel, 200),
      discountAmount: num(p.discountAmount),
    };
  }
  if (Array.isArray(b.photoIds)) q.photoIds = b.photoIds.filter((x) => typeof x === 'string').slice(0, 8);
  if (typeof b.preparedBy === 'string') q.preparedBy = str(b.preparedBy, 100);
  if (b.validDays !== undefined) q.validDays = Math.min(365, Math.max(1, Math.round(num(b.validDays)) || 30));

  await saveQuote(q);
  return NextResponse.json(q);
}
