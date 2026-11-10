import { NextResponse } from 'next/server';
import { getAuthenticatedTeamMember, getTeamAccounts, sanitizeTeamMember } from '../../../lib/team-session';

export async function GET(request) {
  const auth = await getAuthenticatedTeamMember(request);
  const accounts = await getTeamAccounts();
  const team = accounts.map((m) => sanitizeTeamMember(m));

  if (!auth) {
    return NextResponse.json({ authenticated: false, member: null, team }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, member: auth.member, team }, { status: 200 });
}
