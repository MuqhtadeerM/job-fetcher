import nodemailer from "nodemailer";
import config from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Unlike axios (a stateless, one-off HTTP call), sending email via SMTP
 * requires first creating a "transporter" — an object holding the
 * connection details to your mail server. We create it lazily (only
 * when actually needed) and cache it in this module-level variable, so
 * we don't reconnect to the SMTP server on every single email sent.
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    // secure:true means "use TLS from the start of the connection,"
    // conventionally used with port 465. Port 587 (our default) uses
    // STARTTLS instead — the connection starts unencrypted and upgrades
    // to encrypted — so secure should be false for port 587 specifically.
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
}

async function send(message) {
  const isConfigured =
    config.smtp.host &&
    config.smtp.user &&
    config.smtp.pass &&
    config.notifyEmailTo;

  if (!isConfigured) {
    return { sent: false, reason: "Email SMTP settings not fully configured" };
  }

  try {
    const mailer = getTransporter();

    // transporter.sendMail() is nodemailer's core method — it takes an
    // object describing the message (from, to, subject, body) and
    // returns a Promise that resolves once the mail server accepts
    // the message for delivery (not necessarily once it's actually
    // delivered to the recipient's inbox — that's outside our control).
    await mailer.sendMail({
      from: config.smtp.user,
      to: config.notifyEmailTo,
      subject: "Universal Job Fetcher Notification",
      text: message,
    });

    return { sent: true };
  } catch (error) {
    logger.error(`Email notification failed: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

export default { send };
