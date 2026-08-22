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
      from: `"LMS Notifications" <${process.env.GMAIL_USER}>`,
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
