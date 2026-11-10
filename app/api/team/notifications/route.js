import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import { getAuthenticatedTeamMember, updateTeamMemberRecord } from '../../../lib/team-session';

export async function PUT(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const auth = await getAuthenticatedTeamMember(request);
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const notificationId = String(body?.notificationId || '').trim();
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required.' }, { status: 400 });
    }

    const updated = await updateTeamMemberRecord(auth.member.id, (current) => ({
      ...current,
      notifications: (current.notifications || []).map((n) =>
        n.id === notificationId ? { ...n, unread: false } : n
      ),
    }));

    if (!updated) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ member: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
}
