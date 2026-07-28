import { database } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const experienceId = req.nextUrl.searchParams.get('experienceId');

  if (!userId || !experienceId) {
    return NextResponse.json({ error: 'Missing userId or experienceId' }, { status: 400 });
  }

  const user = database.getUser(userId, experienceId);
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const { userId, experienceId, planType } = await req.json();

  if (!userId || !experienceId || !planType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const user = database.setUserPlan(userId, experienceId, planType);
  return NextResponse.json(user);
}
