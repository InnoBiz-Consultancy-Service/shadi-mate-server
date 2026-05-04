"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectInquiryEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configure email transporter
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === "465",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};
// Format date for display
const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "UTC"
    }).format(date);
};
// User Confirmation Email Template
const getUserConfirmationTemplate = (inquiry) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Project Inquiry – Ontonim</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1f24;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0d1f24;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 680px; width: 100%; border-collapse: collapse; background: linear-gradient(180deg, #1b4d5e 0%, #162d35 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 189, 87, 0.1);">
          
          <!-- Top stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ffbd57 0%, #ff9800 50%, #ffbd57 100%); height: 8px; padding: 0;"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d5e 0%, #22636f 100%); padding: 45px 40px; text-align: center;">
              <h1 style="color: #ffbd57; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Thank You!</h1>
              <p style="color: #e0e0e0; font-size: 16px; margin: 0; font-weight: 400;">We Received Your Project Inquiry</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 45px 40px; background-color: #162d35;">
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">Hi ${inquiry.name},</p>
              
              <p style="color: #d0d0d0; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
                We've successfully received your inquiry about <strong style="color: #ffbd57;">"${inquiry.subject}"</strong>. Our team will review your details and contact you soon.
              </p>
              
              <!-- Summary Box -->
              <div style="background: rgba(255, 189, 87, 0.15); border-left: 5px solid #ffbd57; padding: 25px; margin: 0 0 30px 0; border-radius: 10px;">
                <p style="color: #ffbd57; font-size: 13px; margin: 0 0 15px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Inquiry</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Project:</td>
                    <td style="padding: 8px 0; color: #ffbd57; font-size: 14px; text-align: right; font-weight: 600;">${inquiry.projectType}</td>
                  </tr>
                  ${inquiry.budgetRange ? `<tr><td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Budget:</td><td style="padding: 8px 0; color: #ffbd57; font-size: 14px; text-align: right; font-weight: 600;">${inquiry.budgetRange}</td></tr>` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Submitted:</td>
                    <td style="padding: 8px 0; color: #e0e0e0; font-size: 14px; text-align: right; font-weight: 600;">${formatDate(inquiry.createdAt || new Date())}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #d0d0d0; font-size: 15px; line-height: 1.7; margin: 25px 0 0 0;">Best regards,<br><strong style="color: #ffbd57;">The Ontonim Team</strong></p>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; text-align: center; background-color: #162d35;">
              <a href="${process.env.ONTONIM_WEBSITE_URL || "https://www.ontonim.com"}" style="display: inline-block; background: linear-gradient(135deg, #ffbd57 0%, #ff9800 100%); color: #1b4d5e; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 16px rgba(255, 189, 87, 0.3);">
                Visit Our Website
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #0d1f24; padding: 35px 40px; text-align: center; border-top: 1px solid rgba(255, 189, 87, 0.15);">
              <p style="color: #ffbd57; font-size: 12px; margin: 0 0 15px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Connect</p>
              <p style="color: #b0c4cb; font-size: 12px; margin: 0 0 15px 0;">
                <a href="${process.env.ONTONIM_FACEBOOK_URL || "#"}" style="color: #ffbd57; text-decoration: none;">Facebook</a> • 
                <a href="${process.env.ONTONIM_LINKEDIN_URL || "#"}" style="color: #ffbd57; text-decoration: none;">LinkedIn</a> • 
                <a href="${process.env.ONTONIM_TWITTER_URL || "#"}" style="color: #ffbd57; text-decoration: none;">X</a>
              </p>
              <p style="color: #808080; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Ontonim | Rangpur, Bangladesh</p>
            </td>
          </tr>
          
          <!-- Bottom stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ff9800 0%, #ffbd57 50%, #ff9800 100%); height: 8px; padding: 0;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
// Internal Notification Email Template
const getInternalNotificationTemplate = (inquiry) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Inquiry – From ${inquiry.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1f24;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0d1f24;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 680px; width: 100%; border-collapse: collapse; background: linear-gradient(180deg, #1b4d5e 0%, #162d35 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 189, 87, 0.1);">
          
          <!-- Top stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ffbd57 0%, #ff9800 50%, #ffbd57 100%); height: 8px; padding: 0;"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d5e 0%, #22636f 100%); padding: 45px 40px; text-align: center;">
              <h1 style="color: #ffbd57; font-size: 28px; font-weight: 700; margin: 0;">New Project Inquiry</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: #162d35;">
              
              <!-- Client Info -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #ffbd57; font-size: 16px; font-weight: 700; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #ffbd57;">Client Info</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px; width: 30%;">Name:</td>
                    <td style="padding: 8px 0; color: #e0e0e0; font-size: 14px; font-weight: 600;">${inquiry.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Email:</td>
                    <td style="padding: 8px 0; color: #ffbd57; font-size: 14px;"><a href="mailto:${inquiry.email}" style="color: #ffbd57; text-decoration: none;">${inquiry.email}</a></td>
                  </tr>
                </table>
              </div>
              
              <!-- Project Details -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #ffbd57; font-size: 16px; font-weight: 700; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #ffbd57;">Project Details</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px; width: 30%;">Subject:</td>
                    <td style="padding: 8px 0; color: #e0e0e0; font-size: 14px; font-weight: 600;">${inquiry.subject}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Type:</td>
                    <td style="padding: 8px 0; color: #e0e0e0; font-size: 14px; font-weight: 600;">${inquiry.projectType}</td>
                  </tr>
                  ${inquiry.budgetRange ? `<tr><td style="padding: 8px 0; color: #b0c4cb; font-size: 14px;">Budget:</td><td style="padding: 8px 0; color: #e0e0e0; font-size: 14px; font-weight: 600;">${inquiry.budgetRange}</td></tr>` : ""}
                </table>
              </div>
              
              <!-- Message -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #ffbd57; font-size: 16px; font-weight: 700; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #ffbd57;">Message</h2>
                <div style="background: rgba(255, 189, 87, 0.1); border-left: 5px solid #ffbd57; padding: 18px; border-radius: 8px;">
                  <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
                </div>
              </div>
              
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; text-align: center; background-color: #162d35;">
              <a href="mailto:${inquiry.email}" style="display: inline-block; background: linear-gradient(135deg, #ffbd57 0%, #ff9800 100%); color: #1b4d5e; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 35px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 16px rgba(255, 189, 87, 0.3);">
                Reply to Client
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #0d1f24; padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 189, 87, 0.15);">
              <p style="color: #808080; font-size: 12px; margin: 0;">Inquiry received on ${formatDate(inquiry.createdAt || new Date())}</p>
            </td>
          </tr>
          
          <!-- Bottom stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ff9800 0%, #ffbd57 50%, #ff9800 100%); height: 8px; padding: 0;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
// Send User Confirmation Email
const sendUserConfirmation = (inquiry) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Ontonim" <${process.env.SMTP_FROM || "noreply@ontonim.com"}>`,
            to: inquiry.email,
            subject: "We Received Your Project Inquiry – Ontonim",
            html: getUserConfirmationTemplate(inquiry)
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("User confirmation email sent:", info.messageId);
    }
    catch (error) {
        console.error("Failed to send user confirmation email:", error);
        throw error;
    }
});
// Send Internal Notification Email
const sendInternalNotification = (inquiry) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Ontonim System" <${process.env.SMTP_FROM || "noreply@ontonim.com"}>`,
            to: process.env.INTERNAL_EMAIL || "contact@ontonim.com",
            subject: `New Project Inquiry Received – From ${inquiry.name}`,
            html: getInternalNotificationTemplate(inquiry)
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("Internal notification email sent:", info.messageId);
    }
    catch (error) {
        console.error("Failed to send internal notification email:", error);
        throw error;
    }
});
exports.ProjectInquiryEmailService = {
    sendUserConfirmation,
    sendInternalNotification
};
