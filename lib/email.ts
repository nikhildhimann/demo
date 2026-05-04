import "server-only";
import nodemailer from "nodemailer";

type SendEmailOptions = {
  to?: string | null;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | null;
};

type ResolvedEmailOptions = Omit<SendEmailOptions, "to"> & {
  to: string;
};

export type LeadNotificationData = {
  leadName: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  propertyTitle?: string | null;
  propertyUrl?: string | null;
  budget?: string | null;
  location?: string | null;
  source?: string | null;
  submittedAt?: Date | string | null;
  adminUrl?: string | null;
};

const resendEndpoint = "https://api.resend.com/emails";

function cleanRecipient(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function cleanText(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "Real Estate Leads <onboarding@resend.dev>";
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function formatSubmittedAt(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function getNotificationRecipient(fallbackEmail?: string | null) {
  return cleanRecipient(process.env.NOTIFICATION_EMAIL) || cleanRecipient(fallbackEmail);
}

export function buildLeadNotificationEmail(data: LeadNotificationData) {
  const property = cleanText(data.propertyTitle || "General enquiry");
  const submittedAt = formatSubmittedAt(data.submittedAt);
  const fields: Array<[string, string | null | undefined]> = [
    ["Lead name", data.leadName],
    ["Phone", data.phone],
    ["Email", data.email],
    ["Interested property", property],
    ["Budget", data.budget],
    ["Preferred location", data.location],
    ["Source", data.source],
    ["Submitted time", submittedAt],
    ["Message", data.message],
  ];

  const text = [
    `New real estate lead: ${data.leadName}`,
    "",
    ...fields.map(([label, value]) => `${label}: ${cleanText(value)}`),
    data.propertyUrl ? `Property URL: ${data.propertyUrl}` : "",
    data.adminUrl ? `Admin dashboard: ${data.adminUrl}` : "",
  ].filter(Boolean).join("\n");

  const rows = fields.map(([label, value]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#475569;font-weight:600;width:180px;">${escapeHtml(label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;">${escapeHtml(cleanText(value))}</td>
    </tr>
  `).join("");

  const links = [
    data.propertyUrl ? `<a href="${escapeHtml(data.propertyUrl)}" style="color:#0f766e;text-decoration:none;">View property</a>` : "",
    data.adminUrl ? `<a href="${escapeHtml(data.adminUrl)}" style="color:#0f766e;text-decoration:none;">Open admin dashboard</a>` : "",
  ].filter(Boolean).join(" &nbsp; ");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <h1 style="font-size:20px;line-height:1.3;margin:0;">New real estate lead</h1>
          <p style="margin:6px 0 0;color:#cbd5e1;">${escapeHtml(property)}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
        ${links ? `<div style="padding:18px 24px;font-size:14px;">${links}</div>` : ""}
      </div>
    </div>
  `;

  return {
    subject: `New Lead: ${property}`,
    text,
    html,
  };
}

async function sendWithResend(options: ResolvedEmailOptions) {
  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
      reply_to: options.replyTo || undefined,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${details}`);
  }
}

async function sendWithSmtp(options: ResolvedEmailOptions) {
  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: getFromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo || undefined,
  });
}

export async function sendEmail(options: SendEmailOptions) {
  const to = cleanRecipient(options.to);

  if (!to) {
    console.warn("[EMAIL_WARNING] Notification email is not configured. Lead was saved, but email notification was skipped.");
    return { success: false, skipped: true, provider: "none" as const };
  }

  try {
    if (process.env.RESEND_API_KEY) {
      await sendWithResend({ ...options, to, text: options.text });
      return { success: true, provider: "resend" as const };
    }

    if (hasSmtpConfig()) {
      await sendWithSmtp({ ...options, to, text: options.text });
      return { success: true, provider: "smtp" as const };
    }

    console.warn("[EMAIL_WARNING] RESEND_API_KEY or full SMTP settings are missing. Lead was saved, but email notification was skipped.");
    return { success: false, skipped: true, provider: "none" as const };
  } catch (error) {
    console.warn("[EMAIL_WARNING] Lead was saved, but email notification failed.", error);
    return { success: false, skipped: false, provider: process.env.RESEND_API_KEY ? "resend" as const : "smtp" as const };
  }
}

export async function sendLeadNotification(to: string | undefined | null, data: LeadNotificationData) {
  const email = buildLeadNotificationEmail(data);
  return sendEmail({
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: data.email,
  });
}
