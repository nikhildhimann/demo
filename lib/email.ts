interface SendEmailOptions {
  to: string | undefined;
  subject: string;
  body: string;
}

export async function sendEnquiryNotification({ to, subject, body }: SendEmailOptions) {
  if (!to) {
    console.error("[EMAIL_ERROR] No admin email configured.");
    return;
  }

  console.log("-----------------------------------------");
  console.log(`[SMTP_SIMULATION]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.log("-----------------------------------------");

  // In production, use:
  // import nodemailer from 'nodemailer';
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: 'leads@realestate.com', to, subject, text: body });

  return { success: true };
}
