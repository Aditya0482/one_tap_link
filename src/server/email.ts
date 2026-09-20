export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
  replyTo?: string;
}

export async function sendOtpEmail({ to, otp, userName, replyTo }: SendOtpEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  let configuredFrom = process.env.RESEND_FROM_EMAIL?.trim() || 'OneTapLink <support@onetaplink.site>';
  let configuredReplyTo = replyTo || process.env.RESEND_REPLY_TO?.trim();

  // If user provided a public email provider like @gmail.com as FROM,
  // Resend API will reject it because public domains cannot be spoofed.
  // We automatically set it as reply_to and fallback the from address.
  const isPublicProvider = /@(gmail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom);
  let fromEmail = configuredFrom;

  if (isPublicProvider) {
    console.warn(`[Resend Notice] Resend cannot send directly from public email domains (${configuredFrom}). Setting ${configuredFrom} as reply_to.`);
    if (!configuredReplyTo) {
      configuredReplyTo = configuredFrom;
    }
    fromEmail = 'OneTapLink <support@onetaplink.site>';
  }

  const cleanTo = to.trim().toLowerCase();
  const displayName = userName ? userName.trim() : cleanTo.split('@')[0];

  // If no API key is set yet, log the OTP in server console for easy testing
  if (!apiKey) {
    console.log('\n==================================================');
    console.log(`  📧 [Resend Simulated Email]`);
    console.log(`  To:      ${cleanTo}`);
    console.log(`  OTP:     ${otp}  (Valid for 15 minutes)`);
    console.log(`  Notice:  Set RESEND_API_KEY in Railway Variables to send real live emails!`);
    console.log('==================================================\n');
    return { success: true, simulated: true };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your OneTapLink Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Outer Background Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; padding: 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35); border: 1px solid #1E293B;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #090D16 0%, #17123A 50%, #2E1065 100%); padding: 36px 32px 32px 32px; text-align: center; border-bottom: 3px solid #6D5DFB;">
              
              <!-- Brand Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="background-color: rgba(109, 93, 251, 0.15); border: 1px solid rgba(129, 140, 248, 0.4); border-radius: 9999px; padding: 6px 16px;">
                    <span style="font-size: 11px; font-weight: 700; color: #A5B4FC; letter-spacing: 1px; text-transform: uppercase;">
                      ⚡ Official Verification Service
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Logo Title -->
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">
                OneTap<span style="color: #818CF8;">Link</span>
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94A3B8; font-weight: 500;">
                Premium Digital Systems & Workspaces
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background-color: #FFFFFF;">
              
              <!-- Security Shield Badge -->
              <div style="display: inline-block; background-color: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
                <span style="font-size: 12px; font-weight: 700; color: #6D5DFB;">
                  🛡️ Password Reset Request
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                Hi ${displayName}, here is your verification code
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to access or reset the password for your <strong>OneTapLink</strong> account (<span style="color: #6D5DFB; font-weight: 600;">${cleanTo}</span>). Please use the 6-digit code below to securely verify your identity:
              </p>

              <!-- HERO OTP BOX -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 28px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%); border: 2px dashed #6366F1; border-radius: 16px; padding: 26px 20px; text-align: center;">
                    
                    <span style="display: block; font-size: 11px; font-weight: 800; color: #4F46E5; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                      ONE-TIME PASSWORD (OTP)
                    </span>
                    
                    <div style="background-color: #FFFFFF; display: inline-block; padding: 12px 28px; border-radius: 12px; border: 1px solid #C7D2FE; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12); margin-bottom: 10px;">
                      <span style="font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #1E1B4B; text-align: center; display: inline-block; padding-left: 12px;">
                        ${otp}
                      </span>
                    </div>

                    <div style="margin-top: 8px;">
                      <span style="font-size: 12px; font-weight: 600; color: #6D5DFB;">
                        ⏱️ Valid for 15 minutes • Single use only
                      </span>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Important Security Notices Box -->
              <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px 20px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
                  🔒 Security Guidelines
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748B; line-height: 1.7;">
                  <li><strong>Never share this code:</strong> OneTapLink staff will never ask for your verification code.</li>
                  <li><strong>Didn't request this?</strong> You can safely ignore this email; your account remains protected.</li>
                </ul>
              </div>

              <!-- Button CTA -->
              <div style="text-align: center; margin-top: 24px; margin-bottom: 12px;">
                <a href="https://www.onetaplink.site" style="display: inline-block; background: linear-gradient(135deg, #6D5DFB 0%, #4F46E5 100%); color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(109, 93, 251, 0.35);">
                  Open OneTapLink Store →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                OneTapLink Digital Systems
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #94A3B8; line-height: 1.5;">
                Instant Access Digital Templates & Premium Web Workspaces<br>
                <a href="https://www.onetaplink.site" style="color: #6D5DFB; text-decoration: none; font-weight: 600;">www.onetaplink.site</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #CBD5E1;">
                © ${new Date().getFullYear()} OneTapLink. All rights reserved. Automated security notification.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    const emailPayload: any = {
      from: fromEmail,
      to: [cleanTo],
      subject: `Your OneTapLink Password Reset Code: ${otp}`,
      html: htmlContent
    };

    if (configuredReplyTo) {
      emailPayload.reply_to = configuredReplyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('[Resend Email Error]', data);
      return { success: false, error: data?.message || 'Failed to send reset email' };
    }

    console.log(`[Resend Email Sent] Reset OTP email sent successfully to ${cleanTo}, id: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('[Resend Network Error]', err);
    return { success: false, error: err?.message || 'Network error sending reset email' };
  }
}
