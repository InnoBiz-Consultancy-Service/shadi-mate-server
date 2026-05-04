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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnershipEmailService = void 0;
const nodemailer = require("nodemailer");
// Configure email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
// Format date for display
const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: "UTC",
    }).format(date);
};
const getPartnerConfirmationTemplate = (request) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Partnership Request Received – Ontonim</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f1419;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 680px; width: 100%; border-collapse: collapse; background-color: #1b4d5e; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
          
          <!-- Decorative top stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ffbd57 0%, #ff9800 50%, #ffbd57 100%); height: 6px; padding: 0;"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 40px; text-align: center; background: linear-gradient(180deg, #1b4d5e 0%, #164150 100%);">
              <div style="font-size: 56px; margin-bottom: 20px;">🤝</div>
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">Partnership Request Received</h1>
              <p style="color: #ffbd57; font-size: 15px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">Let's Build Success Together</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px; background-color: #1b4d5e;">
              <p style="color: #ffffff; font-size: 17px; font-weight: 600; margin: 0 0 20px 0;">Dear ${request.name},</p>
              
              <p style="color: #e8f4f8; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
                Thank you for your interest in partnering with <strong style="color: #ffbd57;">Ontonim</strong>.
              </p>
              
              <p style="color: #e8f4f8; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
                We have successfully received your partnership request from <strong style="color: #ffffff;">${request.companyName}</strong>. Our partnerships team will carefully review your proposal and get back to you within <strong style="color: #ffbd57;">3-5 business days</strong>.
              </p>
              
              <!-- Partnership Details Box -->
              <div style="background: rgba(255, 189, 87, 0.1); border-left: 4px solid #ffbd57; border-radius: 8px; padding: 30px; margin: 30px 0;">
                <p style="color: #ffbd57; font-size: 14px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Partnership Details:</p>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #b8d4dc; font-size: 15px;">Partnership Type:</td>
                    <td style="padding: 10px 0; color: #ffffff; font-size: 15px; text-align: right; font-weight: 600;">${request.partnershipType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #b8d4dc; font-size: 15px;">Company:</td>
                    <td style="padding: 10px 0; color: #ffffff; font-size: 15px; text-align: right; font-weight: 600;">${request.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #b8d4dc; font-size: 15px;">Submitted On:</td>
                    <td style="padding: 10px 0; color: #ffffff; font-size: 15px; text-align: right; font-weight: 600;">${formatDate(request.createdAt || new Date())}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <div style="background: rgba(255, 152, 0, 0.08); border-left: 4px solid #ff9800; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #ffbd57; font-size: 14px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.8px;">Next Steps:</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #ff9800; font-size: 16px; margin-right: 12px; font-weight: 700;">★</span>
                      <span style="color: #e8f4f8; font-size: 15px; line-height: 1.6;">Our team will review your request</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #ff9800; font-size: 16px; margin-right: 12px; font-weight: 700;">★</span>
                      <span style="color: #e8f4f8; font-size: 15px; line-height: 1.6;">We'll schedule a discovery call if there's a good fit</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #ff9800; font-size: 16px; margin-right: 12px; font-weight: 700;">★</span>
                      <span style="color: #e8f4f8; font-size: 15px; line-height: 1.6;">You'll receive a follow-up email within 3-5 business days</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #e8f4f8; font-size: 16px; line-height: 1.7; margin: 30px 0 0 0;">
                We value potential collaborations and look forward to exploring how we can work together to create mutual success.
              </p>
              
              <p style="color: #d4e7ed; font-size: 15px; line-height: 1.7; margin: 30px 0 0 0;">
                Best regards,<br>
                <strong style="color: #ffbd57;">The Ontonim Partnerships Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 45px 40px; text-align: center; background-color: #1b4d5e;">
              <a href="${process.env.ONTONIM_WEBSITE_URL || "https://www.ontonim.com"}" style="display: inline-block; background: linear-gradient(135deg, #ffbd57 0%, #ff9800 100%); color: #1b4d5e; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 45px; border-radius: 8px; box-shadow: 0 4px 15px rgba(255, 189, 87, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                Visit Our Website
              </a>
              <p style="color: #9ab8c2; font-size: 13px; margin: 16px 0 0 0;">Learn more about Ontonim's services</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #132f3a; padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255, 189, 87, 0.15);">
              <p style="color: #8fa8b3; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                <strong style="color: #ffbd57;">Ontonim</strong> – Innovative IT Solutions
              </p>
              <p style="color: #7a9099; font-size: 13px; margin: 0;">
                This is an automated notification from Ontonim Partnership Management System.
              </p>
            </td>
          </tr>
          
          <!-- Decorative bottom stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ffbd57 0%, #ff9800 50%, #ffbd57 100%); height: 6px; padding: 0;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
// Send Partner Confirmation Email
const sendPartnerConfirmation = (request) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Ontonim Partnerships" <${process.env.SMTP_USER}>`,
            to: request.email,
            subject: "Partnership Request Received – Ontonim",
            html: getPartnerConfirmationTemplate(request),
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("Partner confirmation email sent:", info.messageId);
    }
    catch (error) {
        console.error("Failed to send partner confirmation email:", error);
        throw error;
    }
});
// Send Internal Notification Email
const sendInternalNotification = (request, requestId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Ontonim System" <${process.env.SMTP_USER}>`,
            to: process.env.PARTNERSHIPS_EMAIL || "partnerships@ontonim.com",
            subject: `New B2B Partnership Request – ${request.companyName}`,
            html: getInternalNotificationTemplate(request, requestId),
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("Internal notification email sent:", info.messageId);
    }
    catch (error) {
        console.error("Failed to send internal notification email:", error);
        throw error;
    }
});
exports.PartnershipEmailService = {
    sendPartnerConfirmation,
    sendInternalNotification,
};
function getInternalNotificationTemplate(request, requestId) {
    throw new Error("Function not implemented.");
}
