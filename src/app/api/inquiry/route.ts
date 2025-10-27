import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name || '').trim();
    const email = (body?.email || '').trim();
    const message = (body?.message || '').trim();

    if (!name) return NextResponse.json({message: 'Name is required'}, {status: 400});
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({message: 'Valid email is required'}, {status: 400});
    }
    if (!message) return NextResponse.json({message: 'Message is required'}, {status: 400});

    // In a real app, persist to DB or send email. For now, just log.
    console.log('Inquiry received:', {name, email, message});

    return NextResponse.json({ok: true}, {status: 200});
  } catch (err: any) {
    const msg = err?.message || 'Unexpected error';
    return NextResponse.json({message: msg}, {status: 500});
  }
}
