import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  attachmentUrls?: string[];
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, cc, subject, body, attachmentUrls } = params;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'footpath-issues@resend.dev';

  try {
    // Build attachments from URLs if provided
    const attachments = attachmentUrls
      ? await Promise.all(
          attachmentUrls.map(async (url, index) => {
            try {
              const response = await fetch(url);
              const buffer = await response.arrayBuffer();
              const filename = `photo-${index + 1}.jpg`;
              return {
                filename,
                content: Buffer.from(buffer),
              };
            } catch (error) {
              console.error(`Failed to fetch attachment: ${url}`, error);
              return null;
            }
          })
        ).then(results => results.filter(Boolean) as { filename: string; content: Buffer }[])
      : undefined;

    const emailParams: Parameters<typeof resend.emails.send>[0] = {
      from: `Path Warden <${fromEmail}>`,
      to: [to],
      subject,
      text: body,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    // Add CC if provided
    if (cc) {
      emailParams.cc = [cc];
    }

    const result = await resend.emails.send(emailParams);

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Validate an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
