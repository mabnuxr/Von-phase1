/**
 * Deep Research Email Template
 *
 * This template is designed for email services like SendGrid and MailChimp.
 * It uses table-based layouts and inline CSS for maximum email client compatibility.
 *
 * Template Variables (use these placeholders in SendGrid/MailChimp):
 * - {{query_summary}} - The user's research query
 * - {{conversation_url}} - URL to view the conversation
 * - {{pdf_download_url}} - URL to download the PDF report
 * - {{unsubscribe_url}} - Unsubscribe link (required for CAN-SPAM)
 * - {{current_year}} - Current year for copyright
 */

export const VON_LOGO_URL =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/v2/von_combination_mark.svg';

export interface DeepResearchEmailProps {
  querySummary: string;
  conversationUrl: string;
  pdfDownloadUrl: string;
  unsubscribeUrl: string;
  currentYear?: number;
}

/**
 * Generate the Deep Research email HTML with the given props.
 * For SendGrid/MailChimp, use getDeepResearchEmailTemplate() for the raw template with placeholders.
 */
export function generateDeepResearchEmail(props: DeepResearchEmailProps): string {
  const {
    querySummary,
    conversationUrl,
    pdfDownloadUrl,
    unsubscribeUrl,
    currentYear = new Date().getFullYear(),
  } = props;

  return getDeepResearchEmailTemplate()
    .replace(/\{\{query_summary\}\}/g, querySummary)
    .replace(/\{\{conversation_url\}\}/g, conversationUrl)
    .replace(/\{\{pdf_download_url\}\}/g, pdfDownloadUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
    .replace(/\{\{current_year\}\}/g, String(currentYear));
}

/**
 * Get the raw email template with placeholders for SendGrid/MailChimp.
 * Copy this HTML directly into your email service.
 */
export function getDeepResearchEmailTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Your Deep Research is Ready</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .stack-column-center { text-align: center !important; }
      .center-on-narrow { text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; float: none !important; }
      table.center-on-narrow { display: inline-block !important; }
      .button-td { width: 100% !important; display: block !important; margin-bottom: 12px !important; }
      .button-a { width: 100% !important; display: block !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Visually Hidden Preheader Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your Deep Research analysis is complete and ready for review.
  </div>

  <!-- Email Body -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #f3f4f6;" class="mobile-padding">
              <img src="${VON_LOGO_URL}" alt="Von" width="80" height="32" style="display: inline-block; width: 80px; height: auto;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;" class="mobile-padding">

              <!-- Headline -->
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3; text-align: center;">
                Your Deep Research is Ready
              </h1>

              <!-- Subheadline -->
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
                Your research analysis has been completed and is now available for review.
              </p>

              <!-- Query Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px 24px; border: 1px solid #f3f4f6;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Research Query
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.5; font-style: italic;">
                      "{{query_summary}}"
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 8px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <!-- Primary Button -->
                        <td class="button-td" style="padding-right: 8px;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{conversation_url}}" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="18%" stroke="f" fillcolor="#111827">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:600;">View Conversation</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{conversation_url}}" class="button-a" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-align: center; min-width: 150px;">
                            View Conversation
                          </a>
                          <!--<![endif]-->
                        </td>

                        <!-- Secondary Button -->
                        <td class="button-td" style="padding-left: 8px;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{pdf_download_url}}" style="height:44px;v-text-anchor:middle;width:180px;" arcsize="18%" stroke="t" strokecolor="#e5e7eb" fillcolor="#ffffff">
                            <w:anchorlock/>
                            <center style="color:#111827;font-family:sans-serif;font-size:14px;font-weight:600;">Download PDF</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{pdf_download_url}}" class="button-a" style="display: inline-block; background-color: #ffffff; color: #111827; font-size: 14px; font-weight: 600; text-decoration: none; padding: 11px 24px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; min-width: 150px;">
                            Download PDF
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;" class="mobile-padding">

              <!-- Company Info -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center;">
                <strong style="color: #374151;">Von</strong> by Rattle
              </p>

              <!-- Links -->
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #9ca3af; line-height: 1.5; text-align: center;">
                <a href="https://vonlabs.ai/terms" style="color: #6b7280; text-decoration: underline;">Terms</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://vonlabs.ai/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://vonlabs.ai/security" style="color: #6b7280; text-decoration: underline;">Security</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>

              <!-- Copyright -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center;">
                &copy; {{current_year}} Rattle Software Inc. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        <!-- End Email Container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
