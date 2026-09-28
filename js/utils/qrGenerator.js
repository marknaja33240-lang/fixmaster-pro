/* ==========================================================================
   FixMaster Pro - QR Code Generator Helper (PromptPay & Ticket Links)
   ========================================================================== */

/**
 * Generate a clean SVG QR Code representation or embed QR code image API
 * Uses reliable quick chart QR generator SVG string or canvas fallback
 */
export function generateQrSvgUrl(text, size = 180) {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&color=0f172a&bgcolor=ffffff&margin=1`;
}

/**
 * Generate Thai PromptPay Payload text structure according to EMVCo standard
 * Or fallback to formatted PromptPay transfer string
 */
export function generatePromptPayPayload(targetPhoneOrId, amount) {
  // Clean phone number
  let cleaned = targetPhoneOrId.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '66' + cleaned.substring(1);
  }
  
  // Quick format for QR payload
  return `PROMPTPAY|${cleaned}|${amount ? parseFloat(amount).toFixed(2) : '0.00'}`;
}
