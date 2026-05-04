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
exports.NewsletterEmailService = exports.getEmailTemplate = void 0;
const nodemailer = require('nodemailer');
// Configure email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};
// Ontonim branded email template - matching official website theme
const getEmailTemplate = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ontonim Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1f24;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0d1f24;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(180deg, #1b4d5e 0%, #162d35 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 189, 87, 0.1);">
          
          <!-- Enhanced decorative top stripe with animated gradient effect -->
          <tr>
            <td style="background: linear-gradient(90deg, #ffbd57 0%, #ff9800 50%, #ffbd57 100%); height: 6px; padding: 0;">
            </td>
          </tr>
          
          <!-- Improved header with better visual hierarchy and logo placeholder -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d5e 0%, #22636f 100%); padding: 60px 40px; text-align: center; border-bottom: 1px solid rgba(255, 189, 87, 0.15);">
              <div style="margin-bottom: 25px;">
                <div style="font-size: 48px; font-weight: 700; color: #ffbd57; letter-spacing: -1px;">⚡</div>
              </div>
              <h1 style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.8px;">Welcome to Ontonim</h1>
              <p style="color: #ffbd57; font-size: 16px; margin: 0; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase;">🚀 Innovation Starts Here</p>
              <p style="color: #b0c4cb; font-size: 14px; margin: 12px 0 0 0; font-weight: 400;">Join Bangladesh's Leading IT Innovation Community</p>
            </td>
          </tr>
          
          <!-- Enhanced main content with better typography and spacing -->
          <tr>
            <td style="padding: 60px 40px; background-color: #162d35;">
              <h2 style="color: #ffbd57; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; letter-spacing: -0.5px;">Thank You for Subscribing!</h2>
              
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.8; margin: 0 0 35px 0; font-weight: 500;">
                We're thrilled to have you join the Ontonim community of innovators and forward-thinkers. You've successfully subscribed to receive premium insights, cutting-edge solutions, and exclusive opportunities from Bangladesh's leading IT agency.
              </p>
              
              <!-- Redesigned features box with better borders and spacing -->
              <div style="background: linear-gradient(135deg, rgba(255, 189, 87, 0.12) 0%, rgba(255, 152, 0, 0.08) 100%); border-left: 5px solid #ffbd57; border-radius: 10px; padding: 35px; margin: 40px 0; border: 1px solid rgba(255, 189, 87, 0.2);">
                <p style="color: #ffbd57; font-size: 16px; font-weight: 700; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1.2px;">What You'll Receive:</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 189, 87, 0.12);">
                      <span style="color: #ff9800; font-size: 20px; margin-right: 14px; font-weight: 700;">★</span>
                      <span style="color: #e8e8e8; font-size: 15px; line-height: 1.7; font-weight: 500;">Exclusive tech insights & industry trends</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 189, 87, 0.12);">
                      <span style="color: #ff9800; font-size: 20px; margin-right: 14px; font-weight: 700;">★</span>
                      <span style="color: #e8e8e8; font-size: 15px; line-height: 1.7; font-weight: 500;">Premium offers & early access to services</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; border-bottom: 1px solid rgba(255, 189, 87, 0.12);">
                      <span style="color: #ff9800; font-size: 20px; margin-right: 14px; font-weight: 700;">★</span>
                      <span style="color: #e8e8e8; font-size: 15px; line-height: 1.7; font-weight: 500;">Latest project showcases & case studies</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <span style="color: #ff9800; font-size: 20px; margin-right: 14px; font-weight: 700;">★</span>
                      <span style="color: #e8e8e8; font-size: 15px; line-height: 1.7; font-weight: 500;">Expert tips on digital transformation</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Added pro tip section with enhanced styling -->
              <div style="background: linear-gradient(135deg, rgba(255, 189, 87, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%); border-left: 4px solid #ffbd57; padding: 24px 28px; border-radius: 8px; margin: 35px 0;">
                <p style="color: #e0e0e0; font-size: 14px; line-height: 1.7; margin: 0;">
                  <strong style="color: #ffbd57; font-weight: 700; font-size: 15px;">Pro Tip:</strong> Add <span style="font-family: 'Courier New', monospace; color: #ffbd57;">contact@ontonim.com</span> to your contacts to ensure you never miss our premium updates.
                </p>
              </div>
              
              <p style="color: #d0d0d0; font-size: 15px; line-height: 1.8; margin: 35px 0 0 0; font-style: italic;">
                "Experience excellence in every pixel, every interaction, every detail." – <strong style="color: #ffbd57;">Ontonim</strong>
              </p>
            </td>
          </tr>
          
          <!-- Enhanced CTA button with better styling and hover states -->
          <tr>
            <td style="padding: 0 40px 50px 40px; text-align: center; background-color: #162d35;">
              <a href="${process.env.ONTONIM_WEBSITE_URL || 'https://www.ontonim.com'}" style="display: inline-block; background: linear-gradient(135deg, #ffbd57 0%, #ff9800 100%); color: #1b4d5e; font-size: 16px; font-weight: 700; text-decoration: none; padding: 20px 55px; border-radius: 10px; box-shadow: 0 6px 25px rgba(255, 189, 87, 0.35); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.6px; border: none; cursor: pointer;">
                Explore Ontonim
              </a>
              <p style="color: #8fa5ab; font-size: 13px; margin: 20px 0 0 0; font-weight: 500;">Discover premium digital solutions & innovations</p>
            </td>
          </tr>
          
          <!-- Redesigned footer with enhanced social links and contact info -->
          <tr>
            <td style="background: linear-gradient(180deg, #1b4d5e 0%, #0d1f24 100%); padding: 50px 40px; text-align: center; border-top: 1px solid rgba(255, 189, 87, 0.1);">
              <p style="color: #ffbd57; font-size: 15px; margin: 0 0 32px 0; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">Connect With Us</p>
              
              <table role="presentation" style="margin: 0 auto 40px auto; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 12px;">
                    <a href="${process.env.ONTONIM_FACEBOOK_URL || 'https://www.facebook.com/ontonim'}" style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255, 189, 87, 0.18) 0%, rgba(255, 152, 0, 0.12) 100%); border-radius: 50%; border: 2px solid rgba(255, 189, 87, 0.3); text-align: center; line-height: 44px; font-size: 24px; text-decoration: none; transition: all 0.3s ease; color: #ffbd57;">
                      f
                    </a>
                  </td>
                  <td style="padding: 0 12px;">
                    <a href="${process.env.ONTONIM_LINKEDIN_URL || 'https://www.linkedin.com/company/ontonim'}" style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255, 189, 87, 0.18) 0%, rgba(255, 152, 0, 0.12) 100%); border-radius: 50%; border: 2px solid rgba(255, 189, 87, 0.3); text-align: center; line-height: 44px; font-size: 24px; text-decoration: none; color: #ffbd57; transition: all 0.3s ease;">
                      in
                    </a>
                  </td>
                  <td style="padding: 0 12px;">
                    <a href="${process.env.ONTONIM_TWITTER_URL || 'https://twitter.com/ontonim'}" style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255, 189, 87, 0.18) 0%, rgba(255, 152, 0, 0.12) 100%); border-radius: 50%; border: 2px solid rgba(255, 189, 87, 0.3); text-align: center; line-height: 44px; font-size: 24px; text-decoration: none; color: #ffbd57; transition: all 0.3s ease;">
                      X
                    </a>
                  </td>
                  <td style="padding: 0 12px;">
                    <a href="${process.env.ONTONIM_WEBSITE_URL || 'https://www.ontonim.com'}" style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, rgba(255, 189, 87, 0.18) 0%, rgba(255, 152, 0, 0.12) 100%); border-radius: 50%; border: 2px solid rgba(255, 189, 87, 0.3); text-align: center; line-height: 44px; font-size: 24px; text-decoration: none; color: #ffbd57; transition: all 0.3s ease;">
                      🌐
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="border-top: 1px solid rgba(255, 189, 87, 0.1); padding-top: 35px;">
                <p style="color: #a8b8c0; font-size: 13px; margin: 0 0 10px 0; line-height: 1.7; font-weight: 500;">
                  <strong style="color: #ffbd57; font-size: 14px;">Ontonim</strong> – Bangladesh's Leading IT Agency<br>
                  📍 Rangpur, Bangladesh
                </p>
                <p style="color: #a8b8c0; font-size: 13px; margin: 15px 0;">
                  <a href="tel:+8801997899140" style="color: #ffbd57; text-decoration: none; font-weight: 600;">+(880) 1997-899140</a> | 
                  <a href="mailto:contact@ontonim.com" style="color: #ffbd57; text-decoration: none; font-weight: 600;">contact@ontonim.com</a>
                </p>
                <p style="color: #707880; font-size: 12px; margin: 22px 0 0 0; line-height: 1.7;">
                  © \${new Date().getFullYear()} Ontonim. All rights reserved.<br>
                  You're receiving this email because you subscribed to our newsletter.
                </p>
                <p style="color: #606060; font-size: 11px; margin: 18px 0 0 0; line-height: 1.7;">
                  <a href="${process.env.ONTONIM_WEBSITE_URL || 'https://www.ontonim.com'}/unsubscribe" style="color: #ffbd57; text-decoration: none; font-weight: 500;">Unsubscribe</a> | 
                  <a href="${process.env.ONTONIM_WEBSITE_URL || 'https://www.ontonim.com'}/privacy" style="color: #ffbd57; text-decoration: none; font-weight: 500;">Privacy Policy</a> | 
                  <a href="${process.env.ONTONIM_WEBSITE_URL || 'https://www.ontonim.com'}/terms" style="color: #ffbd57; text-decoration: none; font-weight: 500;">Terms of Service</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Enhanced decorative bottom stripe -->
          <tr>
            <td style="background: linear-gradient(90deg, #ff9800 0%, #ffbd57 50%, #ff9800 100%); height: 6px; padding: 0;">
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
exports.getEmailTemplate = getEmailTemplate;
// Send confirmation email
const sendConfirmationEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Ontonim" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to Ontonim Newsletter! 🎉',
            html: (0, exports.getEmailTemplate)()
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send confirmation email');
    }
});
exports.NewsletterEmailService = {
    sendConfirmationEmail
};
