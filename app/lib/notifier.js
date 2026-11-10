// Server-side notification delivery helper.
// Performs actual external delivery only when a transport (webhook or Resend email)
// is configured in environment variables. Never simulates or reports delivery when
// no delivery provider is active.

const DELIVERY_TIMEOUT_MS = 5000;

function readTrimmedEnv(name) {
  const val = process.env[name];
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
}

export function getConfiguredDeliveryChannels() {
  return {
    webhook: Boolean(readTrimmedEnv('NOTIFICATION_WEBHOOK_URL')),
    email: Boolean(readTrimmedEnv('RESEND_API_KEY') && readTrimmedEnv('NOTIFICATION_FROM_EMAIL')),
  };
}

/**
 * Attempt real delivery of a portal notification or message.
 * Returns truthful delivery status:
 *   - delivered: true only when an external provider accepted the payload (HTTP 2xx)
 *   - status: 'delivered' | 'queued_no_provider' | 'provider_error'
 */
export async function dispatchNotification({ channel, recipient, subject, text, metadata = {} }) {
  const timestamp = new Date().toISOString();
  const webhookUrl = readTrimmedEnv('NOTIFICATION_WEBHOOK_URL');
  const resendKey = readTrimmedEnv('RESEND_API_KEY');
  const fromEmail = readTrimmedEnv('NOTIFICATION_FROM_EMAIL');

  if (channel === 'email' && resendKey && fromEmail && recipient) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject: subject || 'GSDD Foundation Notification',
          text: text || '',
        }),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      if (res.ok) {
        return {
          delivered: true,
          status: 'delivered',
          provider: 'resend',
          timestamp,
          detail: `Delivered via email provider (${res.status})`,
        };
      }
      return {
        delivered: false,
        status: 'provider_error',
        provider: 'resend',
        timestamp,
        detail: `Email provider rejected request (${res.status})`,
      };
    } catch (err) {
      return {
        delivered: false,
        status: 'provider_error',
        provider: 'resend',
        timestamp,
        detail: `Email delivery failed: ${err?.message || 'network error'}`,
      };
    }
  }

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          recipient,
          subject,
          text,
          metadata,
          timestamp,
        }),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      if (res.ok) {
        return {
          delivered: true,
          status: 'delivered',
          provider: 'webhook',
          timestamp,
          detail: `Delivered via configured notification webhook (${res.status})`,
        };
      }
      return {
        delivered: false,
        status: 'provider_error',
        provider: 'webhook',
        timestamp,
        detail: `Notification webhook returned status ${res.status}`,
      };
    } catch (err) {
      return {
        delivered: false,
        status: 'provider_error',
        provider: 'webhook',
        timestamp,
        detail: `Webhook delivery failed: ${err?.message || 'network error'}`,
      };
    }
  }

  return {
    delivered: false,
    status: 'queued_no_provider',
    provider: 'none',
    timestamp,
    detail: 'Saved to server record only. External email/WhatsApp transport is not configured in this environment, so no external notification was sent.',
  };
}
