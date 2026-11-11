import { jsonResponse, requireUnlockedPanelApi } from '../../../../lib/admin-system-api';
import {
  SOFTWARE_SECTIONS,
  getSoftwareSettings,
  resetWebsiteSystemData,
  updateSoftwareSection,
} from '../../../../lib/admin-system-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const err = await requireUnlockedPanelApi(request);
  if (err) return err;

  const { section } = await context.params;
  if (!SOFTWARE_SECTIONS.includes(section)) {
    return jsonResponse({ ok: false, error: 'Unknown software section.' }, 404);
  }
  const all = await getSoftwareSettings();
  return jsonResponse(
    {
      ok: true,
      section,
      data: section === 'reset-website' ? { lastResetAt: all.lastResetAt } : all[section],
    },
    200
  );
}

export async function PATCH(request, context) {
  const err = await requireUnlockedPanelApi(request, { checkOrigin: true });
  if (err) return err;

  const { section } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const res = await updateSoftwareSection(section, body);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, section: res.section, data: res.data }, 200);
}

export async function POST(request, context) {
  const err = await requireUnlockedPanelApi(request, { checkOrigin: true });
  if (err) return err;

  const { section } = await context.params;
  if (section !== 'reset-website') {
    return jsonResponse({ ok: false, error: 'Method not allowed for this section.' }, 405);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const res = await resetWebsiteSystemData({
    confirmationText: body.confirmationText,
    targets: body.targets,
  });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse(res, 200);
}
