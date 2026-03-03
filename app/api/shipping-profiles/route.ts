import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profiles = await prisma.shippingProfile.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      data: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        base_country: profile.base_country,
        method: profile.method,
        bundle_allowed: profile.bundle_allowed,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '배송 프로필을 불러오지 못했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
