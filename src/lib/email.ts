import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, bcc, subject, html }: { to?: string, bcc?: string, subject: string, html: string }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set. Email not sent.");
    return { success: false, error: "Email credentials not configured." };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Code with Abanoub LMS" <${process.env.GMAIL_USER}>`,
      to: to || process.env.GMAIL_USER,
      bcc,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

export function buildEventEmailTemplate(event: {
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  meeting_url?: string;
}) {
  const dateStr = new Date(event.event_date).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://code-with-abanoub-lms.vercel.app";

  let headerColor = "#3b82f6";
  let badgeText = "EVENT";
  let badgeBg = "#eff6ff";
  let badgeColor = "#1d4ed8";
  let actionBtn = "";

  switch (event.event_type) {
    case 'live_session':
      headerColor = "#e11d48";
      badgeText = "🔴 LIVE SESSION";
      badgeBg = "#ffe4e6";
      badgeColor = "#be123c";
      actionBtn = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/calendar" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);">
            🔴 Join Live Classroom Now
          </a>
        </div>
      `;
      break;

    case 'quiz':
      headerColor = "#dc2626";
      badgeText = "📝 QUIZ";
      badgeBg = "#fef2f2";
      badgeColor = "#b91c1c";
      actionBtn = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/calendar" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Quiz Details
          </a>
        </div>
      `;
      break;

    case 'lecture':
      headerColor = "#2563eb";
      badgeText = "📚 LECTURE";
      badgeBg = "#eff6ff";
      badgeColor = "#1d4ed8";
      actionBtn = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/calendar" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Open Calendar Schedule
          </a>
        </div>
      `;
      break;

    case 'assignment':
      headerColor = "#9333ea";
      badgeText = "📋 ASSIGNMENT";
      badgeBg = "#faf5ff";
      badgeColor = "#7e22ce";
      actionBtn = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/calendar" style="background-color: #9333ea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            View Assignment
          </a>
        </div>
      `;
      break;

    case 'holiday':
      headerColor = "#16a34a";
      badgeText = "🎉 HOLIDAY / BREAK";
      badgeBg = "#f0fdf4";
      badgeColor = "#15803d";
      break;

    default:
      headerColor = "#4b5563";
      badgeText = "📢 ANNOUNCEMENT";
      badgeBg = "#f3f4f6";
      badgeColor = "#374151";
      break;
  }

  const subject = event.event_type === 'live_session'
    ? `🔴 Live Session: ${event.title}`
    : `New Event: ${event.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background-color: ${headerColor}; padding: 30px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Code with Abanoub LMS</h1>
        </div>

        <!-- Content Body -->
        <div style="padding: 32px 24px;">
          <div style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            ${badgeText}
          </div>

          <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #111827; font-weight: 700;">
            ${event.title}
          </h2>

          ${event.description ? `
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
              ${event.description}
            </p>
          ` : ''}

          <!-- Details Card -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #6b7280; padding: 6px 0; font-weight: 600; width: 80px;">Date & Time:</td>
                <td style="color: #111827; padding: 6px 0; font-weight: 600;">${dateStr}</td>
              </tr>
            </table>
          </div>

          ${actionBtn}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px 0;" />

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            This is an automated notification from <strong>Code with Abanoub LMS</strong>. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
