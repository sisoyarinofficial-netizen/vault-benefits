import { database } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const experienceId = req.nextUrl.searchParams.get('experienceId');

  if (!experienceId) {
    return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
  }

  const settings = database.getSettings(experienceId);
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const { experienceId, monthlySpins, quarterlySpins, monthlySpinResetHours } = await req.json();

  if (!experienceId || monthlySpins === undefined || quarterlySpins === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const settings = database.updateSettings(
    experienceId,
    monthlySpins,
    quarterlySpins,
    monthlySpinResetHours
  );

  database.logSettingChange(experienceId, 'settings_updated', {
    monthlySpins,
    quarterlySpins,
    monthlySpinResetHours,
  });

  return NextResponse.json(settings);
}
