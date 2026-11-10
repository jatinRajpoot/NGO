import { NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from './portal-auth';
import { getDonorWorkspace } from './portal-store';

export const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function requireAuthenticatedDonor(request) {
  const session = await getPortalSessionFromRequest(request, 'donor');
  if (!session) return null;
  const workspace = await getDonorWorkspace(session.subjectId);
  if (!workspace || (workspace.tokenVersion || 1) !== session.tokenVersion) {
    return null;
  }
  return workspace;
}

export function jsonNoStore(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}
