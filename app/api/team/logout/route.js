import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import { TEAM_COOKIE_NAME, revokeTeamSession, teamCookieOptions } from '../../../lib/team-session';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  await revokeTeamSession(request);
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(TEAM_COOKIE_NAME, '', {
    ...teamCookieOptions(request),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
