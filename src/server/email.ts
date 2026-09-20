export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

export async function sendOtpEmail({ to, otp, userName }: SendOtpEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'OneTapLink <onboarding@resend.dev>';
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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #111827;">
  <div style="max-width: 540px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #111827 0%, #1E1B4B 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        OneTap<span style="color: #818CF8;">Link</span>
      </h1>
      <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 12px; font-weight: 500;">
        Digital Templates & Premium Workspaces
      </p>
    </div>

    <!-- Main Body -->
    <div style="padding: 36px 32px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #111827;">
        Password Reset Verification Code
      </h2>
      
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Hi <strong>${displayName}</strong>, we received a request to reset the password for your OneTapLink account. Use the 6-digit verification code below to complete your password reset:
      </p>

      <!-- OTP Display Box -->
      <div style="background: #EEF2FF; border: 2px dashed #6366F1; border-radius: 14px; text-align: center; padding: 22px 16px; margin: 28px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #4F46E5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
          Your 6-Digit One-Time Password
        </span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #1E1B4B; display: inline-block;">
          ${otp}
        </span>
      </div>

      <div style="background: #F8FAFC; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.5;">
          ⏱️ <strong>This code is valid for 15 minutes.</strong> For your security, never share this code with anyone.
        </p>
      </div>

      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748B;">
        If you did not request a password reset, you can safely ignore this email. Your account remains secure.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94A3B8;">
        © ${new Date().getFullYear()} OneTapLink • <a href="https://www.onetaplink.site" style="color: #6366F1; text-decoration: none;">www.onetaplink.site</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanTo],
        subject: `Your OneTapLink Password Reset Code: ${otp}`,
        html: htmlContent
      })
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
