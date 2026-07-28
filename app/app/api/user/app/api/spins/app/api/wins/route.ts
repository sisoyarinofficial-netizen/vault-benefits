import { database } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const experienceId = req.nextUrl.searchParams.get('experienceId');

  if (!experienceId) {
    return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
  }

  const wins = database.getWinsByExperience(experienceId);
  return NextResponse.json(wins);
}

export async function POST(req: NextRequest) {
  const { userId, experienceId, prize, redeemed } = await req.json();

  if (!userId || !experienceId || prize === undefined || redeemed === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const win = database.updateWinStatus(userId, experienceId, prize, redeemed);
  return NextResponse.json(win);
}
