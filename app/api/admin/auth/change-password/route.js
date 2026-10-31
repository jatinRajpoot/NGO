import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE,
  cookieOptions,
  createSession,
  isHttpsRequest,
  isSameOrigin,
  requireAdminSession,
  updateAdminPassword,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4096;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

function send(body, status, headers = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  });
}

function failure(status, error, message, headers = {}) {
  return send({ ok: false, error, message: message || error }, status, headers);
}

function hasJsonContentType(request) {
  const header = request?.headers?.get ? request.headers.get('content-type') : null;
  if (typeof header !== 'string' || header.trim() === '') return false;
  const mediaType = header.split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return failure(403, 'forbidden_origin', 'Request origin is not allowed.');
    }

    const isAuth = await requireAdminSession();
    if (!isAuth) {
      return failure(401, 'unauthorized', 'You must be logged in to change your password.');
    }

    if (!hasJsonContentType(request)) {
      return failure(400, 'invalid_request', 'Content-Type must be application/json.');
    }

    let bodyText;
    try {
      bodyText = await request.text();
    } catch {
      return failure(400, 'read_error', 'Failed to read request body.');
    }

    if (bodyText.length > MAX_BODY_BYTES) {
      return failure(413, 'payload_too_large', 'Request body exceeds maximum size.');
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return failure(400, 'invalid_json', 'Request body contains invalid JSON.');
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return failure(400, 'invalid_request', 'Request body must be a JSON object.');
    }

    const { oldPassword, newPassword, confirmPassword } = data;

    if (typeof oldPassword !== 'string' || oldPassword.trim().length === 0) {
      return failure(400, 'missing_old_password', 'Current password is required.');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return failure(400, 'weak_password', 'New password must be at least 8 characters long.');
    }

    if (newPassword.length > 1024) {
      return failure(400, 'password_too_long', 'New password cannot exceed 1024 characters.');
    }

    if (typeof confirmPassword !== 'string' || newPassword !== confirmPassword) {
      return failure(400, 'password_mismatch', 'New password and confirmation do not match.');
    }

    if (oldPassword === newPassword) {
      return failure(400, 'same_as_current', 'New password must be different from current password.');
    }

    const updateResult = await updateAdminPassword(oldPassword, newPassword);

    if (!updateResult.ok) {
      if (updateResult.error === 'invalid_current_password') {
        return failure(401, 'invalid_current_password', 'The current password you entered is incorrect.');
      }
      if (updateResult.error === 'invalid_new_password') {
        return failure(400, 'invalid_new_password', 'New password does not meet security requirements.');
      }
      if (updateResult.error === 'same_as_current') {
        return failure(400, 'same_as_current', 'New password must be different from current password.');
      }
      return failure(500, 'update_failed', 'Failed to update password. Please try again.');
    }

    // Rotating password changes fingerprint; mint a fresh token so current admin stays signed in
    const newToken = createSession();
    const isHttps = isHttpsRequest(request);
    const baseCookieOpts = cookieOptions(isHttps);

    const response = send({ ok: true, message: 'Password updated successfully.' }, 200);
    if (newToken) {
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: newToken,
        ...baseCookieOpts,
        secure: Boolean(baseCookieOpts.secure || isHttps),
        maxAge: SESSION_MAX_AGE,
      });
    }

    return response;
  } catch (err) {
    console.error('Error changing password:', err);
    return failure(500, 'internal_error', 'An internal error occurred while changing password.');
  }
}
