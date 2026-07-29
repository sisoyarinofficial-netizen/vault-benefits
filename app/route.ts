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

// API Routes
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // GET /api/user
  if (pathname === '/api/user') {
    const userId = searchParams.get('userId');
    const experienceId = searchParams.get('experienceId');
    if (!userId || !experienceId) {
      return NextResponse.json({ error: 'Missing userId or experienceId' }, { status: 400 });
    }
    const user = database.getUser(userId, experienceId);
    return NextResponse.json(user);
  }

  // GET /api/spins
  if (pathname === '/api/spins') {
    const userId = searchParams.get('userId');
    const experienceId = searchParams.get('experienceId');
    if (!userId || !experienceId) {
      return NextResponse.json({ error: 'Missing userId or experienceId' }, { status: 400 });
    }
    const spins = database.getUserSpins(userId, experienceId);
    return NextResponse.json(spins);
  }

  // GET /api/wins
  if (pathname === '/api/wins') {
    const experienceId = searchParams.get('experienceId');
    if (!experienceId) {
      return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
    }
    const wins = database.getWinsByExperience(experienceId);
    return NextResponse.json(wins);
  }

  // GET /api/settings
  if (pathname === '/api/settings') {
    const experienceId = searchParams.get('experienceId');
    if (!experienceId) {
      return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 });
    }
    const settings = database.getSettings(experienceId);
    return NextResponse.json(settings);
  }

  return NextResponse.json({ message: 'Vault Benefits App Running' });
}

export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  try {
    const body = await req.json();

    // POST /api/user
    if (pathname === '/api/user') {
      const { userId, experienceId, planType } = body;
      if (!userId || !experienceId || !planType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const user = database.setUserPlan(userId, experienceId, planType);
      return NextResponse.json(user);
    }

    // POST /api/spins (execute spin)
    if (pathname === '/api/spins') {
      const { userId, experienceId } = body;
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

    // POST /api/wins
    if (pathname === '/api/wins') {
      const { userId, experienceId, prize, redeemed } = body;
      if (!userId || !experienceId || prize === undefined || redeemed === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const win = database.updateWinStatus(userId, experienceId, prize, redeemed);
      return NextResponse.json(win);
    }

    // POST /api/settings
    if (pathname === '/api/settings') {
      const { experienceId, monthlySpins, quarterlySpins, monthlySpinResetHours } = body;
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

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
