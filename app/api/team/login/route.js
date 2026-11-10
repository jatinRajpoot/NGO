import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import {
  TEAM_COOKIE_NAME,
  authenticateTeamMember,
  createTeamSessionToken,
  teamCookieOptions,
} from '../../../lib/team-session';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const identifier = String(body?.identifier || '').trim();
    const password = String(body?.password || '');

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Official Email/Team ID and password are required.' }, { status: 400 });
    }

    const result = await authenticateTeamMember(identifier, password);
    if (!result) {
      return NextResponse.json(
        {
          error:
            'Invalid Team Member credentials or executive portal password not configured. Read-Only Preview remains available without signing in.',
        },
        { status: 401 }
      );
    }

    const token = createTeamSessionToken(result.member.id, result.tokenVersion);
    const response = NextResponse.json({ member: result.member }, { status: 200 });
    response.cookies.set(TEAM_COOKIE_NAME, token, teamCookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
}
