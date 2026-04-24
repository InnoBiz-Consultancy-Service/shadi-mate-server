import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendMatchEmail = async ({
    to,
    name,
    profileId,
    matchPercentage,
    matchName,
}: {
    to: string;
    name: string;
    profileId: string;
    matchPercentage: number;
    matchName?: string;
}) => {
    try {
        const profileUrl = `${process.env.FRONTEND_URL}/profiles/${profileId}`;

        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #fef3e8 0%, #ffe8d4 100%);
            padding: 20px;
        }
        .container {
            max-width: 520px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 50px rgba(220, 110, 110, 0.15);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #d4614d 0%, #b8476b 100%);
            padding: 50px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '✦';
            position: absolute;
            top: 10px;
            left: 20px;
            font-size: 20px;
            opacity: 0.4;
        }
        .header::after {
            content: '✦';
            position: absolute;
            bottom: 15px;
            right: 25px;
            font-size: 20px;
            opacity: 0.4;
        }
        .header-image {
            width: 140px;
            height: 140px;
            margin: 0 auto 20px;
            display: block;
            animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }
        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 15px;
            opacity: 0.95;
            font-weight: 300;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 45px 35px;
        }
        .greeting {
            font-size: 18px;
            color: #5a4a48;
            margin-bottom: 35px;
            font-weight: 400;
            letter-spacing: 0.3px;
        }
        .greeting strong {
            color: #d4614d;
            font-weight: 600;
        }
        .match-card {
            background: linear-gradient(135deg, #fff5f0 0%, #fef0eb 100%);
            border-radius: 20px;
            padding: 40px 25px;
            text-align: center;
            margin: 35px 0;
            border: 2px solid #f0d9d1;
            box-shadow: 0 8px 20px rgba(212, 97, 77, 0.08);
        }
        .match-label {
            font-size: 11px;
            color: #d4614d;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-bottom: 18px;
        }
        .match-names {
            font-size: 22px;
            font-weight: 600;
            color: #5a4a48;
            margin-bottom: 20px;
            letter-spacing: -0.3px;
        }
        .heart-divider {
            font-size: 26px;
            margin: 0 12px;
            animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }
        .percentage-badge {
            margin: 25px auto;
            text-align: center;
            font-size: 18px;
            color: #5a4a48;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .percentage-circle {
            display: none;
        }
        .percentage-number {
            display: none;
        }
        .percentage-symbol {
            display: none;
        }
        .percentage-label {
            display: none;
        }
        .traits {
            margin-top: 25px;
            font-size: 13px;
            color: #8b7a77;
        }
        .traits-title {
            font-weight: 700;
            color: #d4614d;
            margin-bottom: 12px;
            font-size: 13px;
            letter-spacing: 0.5px;
        }
        .trait-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }
        .trait {
            background: white;
            color: #d4614d;
            padding: 7px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            border: 1.5px solid #f0d9d1;
            letter-spacing: 0.2px;
        }
        .cta-button {
            display: inline-block;
            width: 100%;
            background: linear-gradient(135deg, #d4614d 0%, #b8476b 100%);
            color: white;
            text-decoration: none;
            padding: 18px 32px;
            border-radius: 14px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 35px 0;
            transition: all 0.3s ease;
            letter-spacing: 0.3px;
            box-shadow: 0 10px 25px rgba(212, 97, 77, 0.2);
        }
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(212, 97, 77, 0.3);
        }
        .description {
            color: #6b5a57;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 28px;
            font-weight: 400;
            letter-spacing: 0.2px;
        }
        .footer {
            background: linear-gradient(135deg, #fef5f2 0%, #fef0eb 100%);
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #8b7a77;
            border-top: 1px solid #f0d9d1;
        }
        .footer a {
            color: #d4614d;
            text-decoration: none;
            font-weight: 600;
        }
        .footer p {
            margin-bottom: 12px;
            line-height: 1.6;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #f0d9d1, transparent);
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co/zHFjgs2c/Couple-love-removebg-preview.png" alt="Couple hands" class="header-image">
            <h1>A Perfect Soulmate Match!</h1>
            <p>Love finds a way, and we found it for you</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear <strong>${name}</strong>, 💌
            </div>
            
            <p class="description">
                What a special moment this is! We're thrilled to introduce someone truly remarkable who shares your values, dreams, and essence.
            </p>
            
            <div class="match-card">
                <div class="match-label">💫 Divine Connection Found</div>
                
                <div class="match-names">
                    ${name}
                    <span class="heart-divider">💕</span>
                    ${matchName || "Your Soulmate"}
                </div>
                
                <div class="percentage-badge">
                    Compatibility: <strong>${matchPercentage.toFixed(0)}%</strong>
                </div>
                
                <div class="traits">
                    <div class="traits-title">Compatibility Profile</div>
                    <div class="trait-tags">
                        <span class="trait">Values Aligned</span>
                        <span class="trait">Life Goals Match</span>
                        <span class="trait">Personality Harmony</span>
                    </div>
                </div>
            </div>
            
            <p class="description">
                This isn't just another match. Our advanced psychological compatibility algorithm has identified a genuine connection that goes beyond simple statistics. Every personality trait, life goal, and value has been carefully analyzed to bring you two together. This is destiny at work.
            </p>
            
            <a href="${profileUrl}" class="cta-button">Discover Your Soulmate ✨</a>
            
            <p style="text-align: center; color: #a08a84; font-size: 13px; letter-spacing: 0.2px;">
                A beautiful journey begins with a single step. Take yours today.
            </p>
        </div>
        
        <div class="footer">
            <div class="divider"></div>
            <p>
                🌹 This sacred match was discovered using AI-powered behavioral analysis and personality psychology
            </p>
            <p style="margin-bottom: 0;">
                © 2024 <strong>ShadiMate</strong> — Where True Love Begins<br>
                <a href="${process.env.FRONTEND_URL}">Visit Our Matrimony Platform</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"ShadiMate ✨" <${process.env.SMTP_USER}>`,
            to,
            subject: `🎉 It's a Match! ${matchPercentage.toFixed(0)}% Compatible with ${matchName || "Your Perfect Match"}`,
            html: emailHTML,
        });

        console.log(`✅ Match email sent to ${to}`);
    } catch (error) {
        console.log("❌ Email sending failed:", error);
    }
};
