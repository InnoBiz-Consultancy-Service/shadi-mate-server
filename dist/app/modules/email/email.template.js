"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// ShadiMate Email Template
// Design inspired by: https://shadimate-client.vercel.app/
// Color palette: deep cream bg, rose-pink brand (#b8476b / #d4614d),
//               warm ivory surface, serif + sans-serif typography
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShadiMateEmailTemplate = void 0;
const generateShadiMateEmailTemplate = ({ subject, body, recipientName, }) => {
    // If body has no HTML tags, convert newlines to <p> paragraphs
    const hasHtml = /<[a-z][\s\S]*>/i.test(body);
    const formattedBody = hasHtml
        ? body
        : body
            .split(/\n\n+/)
            .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
            .join("\n");
    const greeting = recipientName
        ? `Dear <span style="color:#b8476b;font-weight:600">${recipientName}</span>,`
        : `Dear Valued Member,`;
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7ede6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7ede6;min-height:100vh">
    <tr>
      <td align="center" style="padding:40px 16px">

        <!-- Email card: max 600px -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <!-- ── HEADER ─────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:28px">
              <!-- Logo wordmark -->
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#b8476b;letter-spacing:-1px;line-height:1">
                ShadiMate
              </div>
              <div style="font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#c0897a;margin-top:5px;font-weight:400">
                Find Your Soul's Connection
              </div>
            </td>
          </tr>

          <!-- ── CARD ──────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(160,60,60,0.10)">

              <!-- Top gradient stripe -->
              <div style="height:5px;background:linear-gradient(90deg,#d4614d 0%,#b8476b 50%,#9d5baf 100%)"></div>

              <!-- Hero banner (আইকন পরিবর্তন: সার্কেল বাদ, শুধু মেইল আইকন) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2d1e1a 0%,#1a0e0b 100%);padding:44px 48px 40px;text-align:center">
                    <!-- Mail Icon (সার্কেল ছাড়া) -->
                    <div style="margin-bottom:16px">
                      <span style="font-size:48px">💌</span>
                    </div>
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#f5e6d8;font-weight:400;line-height:1.25;letter-spacing:-0.3px;margin-bottom:8px">
                      ${subject}
                    </div>
                    <div style="width:48px;height:2px;background:linear-gradient(90deg,#d4614d,#b8476b);margin:14px auto 0;border-radius:2px"></div>
                  </td>
                </tr>
              </table>

              <!-- Body content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 48px 44px">

                    <!-- Greeting -->
                    <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2d1e1a;margin:0 0 22px;line-height:1.4">
                      ${greeting}
                    </p>

                    <!-- Ornament divider -->
                    <div style="text-align:center;margin:0 0 26px;color:#d4614d;font-size:16px;letter-spacing:10px;opacity:0.45">
                      ✦ ✦ ✦
                    </div>

                    <!-- Main content -->
                    <div style="font-size:15px;line-height:1.85;color:#4a3530">
                      ${formattedBody}
                    </div>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:36px auto 0">
                      <tr>
                        <td align="center" style="border-radius:50px;background:linear-gradient(135deg,#d4614d 0%,#b8476b 100%)">
                          <a href="https://shadimate-client.vercel.app/"
                             style="display:inline-block;padding:14px 40px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
                            Visit ShadiMate &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Bottom stripe -->
              <div style="height:2px;background:linear-gradient(90deg,transparent,#e8ccc4,transparent)"></div>

            </td>
          </tr>

          <!-- ── FOOTER ─────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:28px 16px 8px">

              <!-- Heart row -->
              <div style="font-size:12px;color:#d4614d;letter-spacing:6px;margin-bottom:14px">&#9829; &nbsp; &#9829; &nbsp; &#9829;</div>

              <p style="font-size:13px;color:#9a7060;margin:0 0 6px;line-height:1.6">
                <strong style="color:#7a4a3a">ShadiMate</strong> — Where True Love Begins
              </p>
              <p style="font-size:12px;color:#b49080;margin:0 0 6px">
                <a href="https://shadimate-client.vercel.app/" style="color:#b8476b;text-decoration:none">shadimate-client.vercel.app</a>
              </p>
              <p style="font-size:11px;color:#c4a898;margin:14px 0 0;line-height:1.7">
                You are receiving this email because you are a registered member of ShadiMate.<br>
                &copy; ${year} ShadiMate Inc. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
};
exports.generateShadiMateEmailTemplate = generateShadiMateEmailTemplate;
