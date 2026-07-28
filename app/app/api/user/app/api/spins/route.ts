import { database } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

const PRIZE_DISTRIBUTION = {
  noWin: 0.70,
  bonusSpin: 0.10,
  threeDay: 0.12,
  freeLesson: 0.08,
};

function determineWin(random: number) {
  let cumulative = 0;

  if (random < (cumulative += PRIZE_DISTRIBUTION.noWin)) return 'noWin';
  if (random < (cumulative += PRIZE_DISTRIBUTION.bonusSpin)) return 'bonusSpin';
  if (random < (cumulative += PRIZE_DISTRIBUTION.threeDay)) return 'threeDay';
  if (random < (cumulative += PRIZE_DISTRIBUTION.freeLesson)) return 'freeLesson';

  return 'noWin';
}

export async function POST(req: NextRequest) {
  const { userId, experienceId } = await req.json();

  if (!userId || !experienceId) {
    return NextResponse.json({ error: 'Missing userId or experienceId' }, { status: 400 });
  }

  const user = database.getUser(userId, experienceId);

  if (user.spinsAvailable <= 0) {
    return NextResponse.json(
      { error: 'No spins available', spinsAvailable: 0 },
      { status: 400 }
    );
  }

  const random = Math.random();
  const prize = determineWin(random);

  database.recordWin(userId, experienceId, prize);
  database.decrementSpin(userId, experienceId);

  if (prize === 'bonusSpin') {
    database.addBonusSpin(userId, experienceId);
  }

  return NextResponse.json({
    prize,
    spinsRemaining: database.getUser(userId, experienceId).spinsAvailable,
  });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const experienceId = req.nextUrl.searchParams.get('experienceId');

  if (!userId || !experienceId) {
    return NextResponse.json({ error: 'Missing userId or experienceId' }, { status: 400 });
  }

  const spins = database.getUserSpins(userId, experienceId);
  return NextResponse.json(spins);
}
