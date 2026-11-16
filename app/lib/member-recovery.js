import { createHash, randomBytes } from 'node:crypto';
import { memberAccountStore, portalRecordStore } from './portal-store';
import { hashPassword } from './portal-auth';
import { dispatchNotification, getConfiguredDeliveryChannels } from './notifier';

const digest = value => createHash('sha256').update(value).digest('hex');
const collection = 'member-password-resets';
const genericMessage = 'If that account exists, a password reset code has been sent to its email address.';

export async function requestMemberPasswordReset(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, status: 400, error: 'Enter a valid email address.' };
  const channels = getConfiguredDeliveryChannels();
  if (!channels.email && !channels.webhook) return { ok: false, status: 503, error: 'Email recovery is unavailable. Contact the foundation office for account assistance.' };
  return portalRecordStore.run(collection, async () => {
    const now = Date.now();
    const resets = (await portalRecordStore.read(collection, () => [])).filter(r => r.expiresAt > now);
    const emailHash = digest(email);
    if (resets.some(r => r.emailHash === emailHash && now - r.requestedAt < 60000)) return { ok: true, status: 200, message: genericMessage };
    const account = (await memberAccountStore.read()).find(m => m.email.toLowerCase() === email);
    const token = randomBytes(32).toString('base64url');
    resets.push({ emailHash, tokenHash: digest(token), memberId: account?.id || null, requestedAt: now, expiresAt: now + 30 * 60000, used: false });
    await portalRecordStore.write(collection, resets.slice(-10000));
    if (account) await dispatchNotification({ channel: 'email', recipient: account.email, subject: 'Reset your GSDD Member Portal password',
      text: `Your password reset code is:\n${token}\n\nEnter this code on the password recovery page within 30 minutes. If you did not request a reset, ignore this email.`,
      metadata: { kind: 'member_password_reset', resetToken: token } });
    return { ok: true, status: 200, message: genericMessage };
  });
}

export async function confirmMemberPasswordReset({ token, newPassword }) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 1024) {
    return { ok: false, status: 400, error: 'A valid emailed reset code and a password of 8 to 1024 characters are required.' };
  }
  const passwordHash = await hashPassword(newPassword);
  return portalRecordStore.run(collection, async () => {
    const resets = await portalRecordStore.read(collection, () => []);
    const record = resets.find(r => r.tokenHash === digest(token) && !r.used && r.expiresAt > Date.now() && r.memberId);
    if (!record) return { ok: false, status: 400, error: 'This reset code is invalid, expired or already used. Request another code.' };
    record.used = true;
    await portalRecordStore.write(collection, resets);
    return memberAccountStore.run(async () => {
      const members = await memberAccountStore.read();
      const member = members.find(m => m.id === record.memberId);
      if (!member) return { ok: false, status: 400, error: 'Account no longer exists.' };
      member.passwordHash = passwordHash;
      member.tokenVersion = (member.tokenVersion || 1) + 1;
      await memberAccountStore.write(members);
      return { ok: true, status: 200, message: 'Password updated. Sign in with your new password.' };
    });
  });
}
