import { NextRequest, NextResponse } from 'next/server';
import { lookupCouncil, getCouncilEmail, getCouncilEmailPatterns } from '@/lib/mapit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat or lng parameter' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid lat or lng parameter' },
        { status: 400 }
      );
    }

    const council = await lookupCouncil(latitude, longitude);

    if (!council) {
      return NextResponse.json(
        { error: 'Could not find council for this location' },
        { status: 404 }
      );
    }

    const email = getCouncilEmail(council.name);
    const emailPatterns = email ? undefined : getCouncilEmailPatterns(council.name);

    return NextResponse.json({
      council,
      email,
      emailPatterns,
    });
  } catch (error) {
    console.error('Error looking up council:', error);
    return NextResponse.json(
      { error: 'Failed to look up council' },
      { status: 500 }
    );
  }
}
