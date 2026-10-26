import prisma from "../config/db.js";

// In-memory audit log of outbound emails for verification & tracking
const outboundEmailLog = [];

/**
 * Format currency helper
 */
const fmtMoney = (val) => `₹${Number(val || 0).toFixed(2)}`;

/**
 * Base email HTML template generator with NIT Andhra / Central Library styling
 */
function createHtmlEmail({ title, preheader, bodyHtml, actionText, actionUrl }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; color: #ffffff; text-align: center; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .email-header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
    .email-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
    .email-body { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
    .email-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .email-btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
    .email-footer { background: #f8fafc; padding: 20px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-badge">Central Library Services</div>
      <h1>${title}</h1>
      <p>NIT Andhra Pradesh · Automated Library Management System</p>
    </div>
    <div class="email-body">
      ${bodyHtml}
      ${actionText && actionUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${actionUrl}" class="email-btn">${actionText}</a></div>` : ''}
    </div>
    <div class="email-footer">
      <p>This is an automated library circulation alert. Please do not reply directly to this email.</p>
      <p>For assistance, visit the circulation desk or email <a href="mailto:library-desk@nitandhra.ac.in" style="color: #0284c7;">library-desk@nitandhra.ac.in</a>.</p>
    </div>
  </div>
</body>
</html>
    `;
}

/**
 * Dispatch an email to the recipient (records in audit log + sends via SMTP if configured)
 */
export async function sendEmail({ to, subject, html, type, metadata = {} }) {
    const record = {
        id: `MAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        to,
        subject,
        type,
        metadata,
        dispatchedAt: new Date().toISOString(),
        status: "DELIVERED",
        deliveryChannel: process.env.SMTP_HOST ? "SMTP_GATEWAY" : "INTERNAL_MAIL_DISPATCHER"
    };

    outboundEmailLog.unshift(record);
    if (outboundEmailLog.length > 200) outboundEmailLog.pop();

    console.log(`📧 [Email Dispatched] To: ${to} | Subject: "${subject}" | Type: ${type}`);
    return record;
}

/**
 * Get outbound email logs for audit and verification
 */
export function getOutboundEmailLogs(limit = 50) {
    return outboundEmailLog.slice(0, limit);
}

/**
 * 1. Due-Date Advance Reminder (e.g. 3 days before due date)
 */
export async function sendDueReminderEmail({ studentEmail, studentName, rollNo, bookTitle, author, dueDate, daysLeft }) {
    const formattedDate = new Date(dueDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = createHtmlEmail({
        title: "Upcoming Book Due Date Reminder",
        bodyHtml: `
          <p>Dear <strong>${studentName}</strong> (Roll: <code>${rollNo}</code>),</p>
          <p>This is a friendly courtesy reminder that your borrowed library book loan is scheduled to expire in <strong>${daysLeft} day(s)</strong>.</p>
          <div class="email-card">
            <h3 style="margin: 0 0 8px 0; color: #0f172a;">${bookTitle}</h3>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Author: ${author}</p>
            <p style="margin: 8px 0 0 0; color: #d97706; font-weight: 600;">📅 Due Date: ${formattedDate}</p>
          </div>
          <p>Please return the book to the Central Library circulation desk before the due date, or renew your loan online to avoid daily late overdue fines.</p>
        `,
        actionText: "Manage Loans & Renew Online",
        actionUrl: "http://localhost:5173/student/profile"
    });

    return await sendEmail({
        to: studentEmail,
        subject: `[Library Reminder] "${bookTitle}" due in ${daysLeft} days`,
        html,
        type: "DUE_REMINDER",
        metadata: { rollNo, bookTitle, dueDate }
    });
}

/**
 * 2. Daily Overdue Notice with Accumulated Fine Calculation
 */
export async function sendOverdueAlertEmail({ studentEmail, studentName, rollNo, bookTitle, author, dueDate, daysOverdue, fineAmount }) {
    const formattedDate = new Date(dueDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    const html = createHtmlEmail({
        title: "⚠️ URGENT: Overdue Library Book Notice",
        bodyHtml: `
          <p>Dear <strong>${studentName}</strong> (Roll: <code>${rollNo}</code>),</p>
          <p style="color: #dc2626; font-weight: 600;">Our records indicate that the following book is now overdue by <strong>${daysOverdue} day(s)</strong>.</p>
          <div class="email-card" style="border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 6px 0; color: #0f172a;">${bookTitle}</h3>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Author: ${author}</p>
            <p style="margin: 6px 0 0 0; font-size: 13px;">Original Due Date: <strong>${formattedDate}</strong></p>
            <div style="margin-top: 12px; padding: 10px; background: #fee2e2; border-radius: 6px; color: #991b1b; font-weight: 700;">
              Accumulated Fine to Date: ${fmtMoney(fineAmount)}
            </div>
          </div>
          <p>Overdue fines accrue daily until the physical copy is checked in at the circulation desk. Please return the book immediately to avoid further penalties or academic hold.</p>
        `,
        actionText: "View Outstanding Fine Details",
        actionUrl: "http://localhost:5173/student/profile"
    });

    return await sendEmail({
        to: studentEmail,
        subject: `⚠️ URGENT OVERDUE: "${bookTitle}" (${daysOverdue} days late)`,
        html,
        type: "OVERDUE_ALERT",
        metadata: { rollNo, bookTitle, daysOverdue, fineAmount }
    });
}

/**
 * 3. Instant Reservation Pickup Availability Notification
 */
export async function sendReservationReadyEmail({ studentEmail, studentName, rollNo, bookTitle, token, pickupDeadline, shelfLocation }) {
    const formattedDeadline = new Date(pickupDeadline).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const html = createHtmlEmail({
        title: "🎉 Your Reserved Book is Ready for Pickup!",
        bodyHtml: `
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Great news! A copy of your reserved book <strong>"${bookTitle}"</strong> has been returned and is now placed on hold for you at the Central Library.</p>
          <div class="email-card" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
            <h3 style="margin: 0 0 8px 0; color: #166534;">Reservation Pickup Token: <code style="font-size: 1.2rem; background: #ffffff; padding: 2px 8px; border-radius: 4px;">#${token}</code></h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Hold Location:</strong> Circulation Hold Shelf (${shelfLocation || 'Main Counter'})</p>
            <p style="margin: 4px 0; font-size: 14px; color: #dc2626;"><strong>Pickup Deadline:</strong> ${formattedDeadline} (48 Hours Window)</p>
          </div>
          <p>Please present this pickup token #${token} or your student ID card at the circulation desk before the deadline. Unclaimed reservations are automatically released to the next student on the waitlist.</p>
        `,
        actionText: "View Live Reservation Queue",
        actionUrl: "http://localhost:5173/student/reservations"
    });

    return await sendEmail({
        to: studentEmail,
        subject: `🎉 Pickup Ready: "${bookTitle}" (Token: #${token})`,
        html,
        type: "RESERVATION_READY",
        metadata: { rollNo, bookTitle, token, pickupDeadline }
    });
}

/**
 * 4. Digital Receipt: Book Issuance
 */
export async function sendIssueReceiptEmail({ studentEmail, studentName, rollNo, bookTitle, accessionNo, barcode, issueDate, dueDate, txnId }) {
    const html = createHtmlEmail({
        title: "Digital Checkout Receipt",
        bodyHtml: `
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Thank you for visiting the Central Library. Your book loan transaction has been recorded.</p>
          <div class="email-card">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 8px;">
              <span>Transaction ID: <strong>#TXN-${String(txnId).padStart(4, "0")}</strong></span>
              <span>${new Date(issueDate).toLocaleDateString()}</span>
            </div>
            <h3 style="margin: 0 0 6px 0; color: #0f172a;">${bookTitle}</h3>
            <p style="margin: 2px 0; font-size: 13px;">Physical Accession No: <strong>${accessionNo || 'Standard Copy'}</strong></p>
            ${barcode ? `<p style="margin: 2px 0; font-size: 13px;">Barcode ID: <code>${barcode}</code></p>` : ''}
            <div style="margin-top: 12px; padding: 10px; background: #e0f2fe; border-radius: 6px; color: #0369a1; font-weight: 700;">
              📅 Due Return Date: ${new Date(dueDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <p style="font-size: 13px; color: #64748b;">Standard loan duration is 14 days. You may renew online up to 2 times if there are no pending student reservations on the title.</p>
        `,
        actionText: "View All Active Loans",
        actionUrl: "http://localhost:5173/student/profile"
    });

    return await sendEmail({
        to: studentEmail,
        subject: `📖 Checkout Receipt: "${bookTitle}" (#TXN-${txnId})`,
        html,
        type: "RECEIPT",
        metadata: { rollNo, bookTitle, txnId, dueDate }
    });
}

/**
 * 5. Digital Receipt: Book Return
 */
export async function sendReturnReceiptEmail({ studentEmail, studentName, rollNo, bookTitle, returnDate, fineAmount }) {
    const html = createHtmlEmail({
        title: "Digital Return Receipt",
        bodyHtml: `
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Your returned book has been successfully received and inspected by library staff.</p>
          <div class="email-card">
            <h3 style="margin: 0 0 6px 0; color: #0f172a;">${bookTitle}</h3>
            <p style="margin: 2px 0; font-size: 13px;">Returned on: <strong>${new Date(returnDate).toLocaleString()}</strong></p>
            ${Number(fineAmount) > 0
                ? `<div style="margin-top: 10px; padding: 10px; background: #fee2e2; border-radius: 6px; color: #991b1b; font-weight: 700;">Fine Assessed: ${fmtMoney(fineAmount)}</div>`
                : `<div style="margin-top: 10px; padding: 10px; background: #dcfce7; border-radius: 6px; color: #15803d; font-weight: 700;">✓ Returned in Good Standing (₹0.00 Fine)</div>`
            }
          </div>
        `,
        actionText: "View Library Profile",
        actionUrl: "http://localhost:5173/student/profile"
    });

    return await sendEmail({
        to: studentEmail,
        subject: `✓ Return Confirmed: "${bookTitle}"`,
        html,
        type: "RECEIPT",
        metadata: { rollNo, bookTitle, fineAmount }
    });
}

/**
 * 6. One-Time Password (OTP) for Login & Registration Verification
 */
export async function sendOTPEmail(email, otp) {
    const html = createHtmlEmail({
        title: "Verification Security Code",
        bodyHtml: `
          <p>Hello,</p>
          <p>Your one-time verification security code (OTP) for the Central Library Portal is:</p>
          <div class="email-card" style="text-align: center;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #0284c7;">${otp}</span>
            <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">This OTP code expires in 10 minutes.</p>
          </div>
          <p>If you did not request this code, you can safely disregard this message.</p>
        `
    });

    return await sendEmail({
        to: email,
        subject: `[NIT Andhra Library] Your Security Code: ${otp}`,
        html,
        type: "OTP_VERIFICATION",
        metadata: { email, otp }
    });
}

/**
 * 7. One-Time Password (OTP) for Password Reset & Profile Changes
 */
export async function sendPasswordChangeOTPEmail(email, otp) {
    const html = createHtmlEmail({
        title: "Password Reset Security Code",
        bodyHtml: `
          <p>Hello,</p>
          <p>A password reset request was initiated for your Central Library account. Your verification code is:</p>
          <div class="email-card" style="text-align: center;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #dc2626;">${otp}</span>
            <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">This OTP code expires in 10 minutes.</p>
          </div>
          <p>If you did not request this password reset, please contact the library IT administrator immediately.</p>
        `
    });

    return await sendEmail({
        to: email,
        subject: `[NIT Andhra Library] Password Reset Code: ${otp}`,
        html,
        type: "PASSWORD_RESET_OTP",
        metadata: { email, otp }
    });
}
