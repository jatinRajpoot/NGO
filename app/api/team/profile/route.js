import { NextResponse } from 'next/server';
import { isSameOrigin } from '../../../lib/admin-auth';
import { getAuthenticatedTeamMember, updateTeamMemberRecord } from '../../../lib/team-session';

export async function PATCH(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const auth = await getAuthenticatedTeamMember(request);
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateTeamMemberRecord(auth.member.id, (current) => {
      const next = { ...current };
      if (typeof body?.name === 'string' && body.name.trim()) next.name = body.name.trim().slice(0, 120);
      if (typeof body?.phone === 'string' && body.phone.trim()) next.phone = body.phone.trim().slice(0, 40);
      if (typeof body?.email === 'string' && body.email.trim()) next.email = body.email.trim().slice(0, 160);
      if (typeof body?.address === 'string') next.address = body.address.trim().slice(0, 240);
      if (typeof body?.qualifications === 'string') next.qualifications = body.qualifications.trim().slice(0, 200);
      if (typeof body?.bio === 'string') next.bio = body.bio.trim().slice(0, 1000);

      if (typeof body?.photoUrl === 'string' && body.photoUrl.trim()) {
        const cleanUrl = body.photoUrl.trim().slice(0, 500);
        next.photoPending = {
          requestedUrl: cleanUrl,
          status: 'Pending Admin Review',
          date: new Date().toISOString().split('T')[0],
        };
      }
      return next;
    });

    if (!updated) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ member: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
}
