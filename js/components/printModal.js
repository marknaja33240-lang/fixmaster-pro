/* ==========================================================================
   FixMaster Pro - Printable Repair Ticket & Slip Receipt Modal Component
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDateTime, getStatusMeta } from '../utils/formatters.js';
import { generatePromptPayPayload, generateQrSvgUrl } from '../utils/qrGenerator.js';

export function initPrintReceiptModal() {
  window.showPrintReceiptModal = function(ticketId, options = {}) {
    const ticket = store.getTicketById(ticketId);
    if (!ticket) return;

    const shopInfo = store.getShopInfo();
    const existingModal = document.getElementById('print-receipt-modal');
    if (existingModal) existingModal.remove();

    const trackingUrl = window.location.href.split('#')[0] + `?track=${ticket.ticketId}`;
    const subtotal = ticket.partsUsed.reduce((s, p) => s + (p.price * p.quantity), 0) + ticket.laborFee;
    const netPayable = Math.max(0, subtotal - ticket.discount - ticket.deposit);

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.id = 'print-receipt-modal';
    modal.style.zIndex = '3000';

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 580px;">
        <div class="modal-header">
          <h3><i class="fas fa-print" style="color: var(--accent-primary);"></i> พิมพ์ใบรับซ่อม / ใบเสร็จ (${ticket.ticketId})</h3>
          <button class="modal-close" id="btn-close-print-modal">&times;</button>
        </div>

        <div class="modal-body" style="background: #f8fafc; color: #0f172a; padding: 1.5rem;">
          <!-- Printable Container (Will render black & white on paper) -->
          <div class="print-area receipt-slip" style="background: #fff; padding: 1.25rem; border-radius: 8px; border: 1px solid #cbd5e1; font-family: 'Prompt', sans-serif;">
            
            <!-- Receipt Header -->
            <div class="receipt-header">
              <div class="receipt-title">${shopInfo.name}</div>
              <div class="receipt-subtitle">${shopInfo.branch}</div>
              <div class="receipt-subtitle">${shopInfo.address}</div>
              <div class="receipt-subtitle">โทร: ${shopInfo.phone} | LINE: ${shopInfo.lineId}</div>
            </div>

            <!-- Title & Ticket ID -->
            <div style="text-align: center; margin: 10px 0; border-bottom: 2px solid #000; padding-bottom: 6px;">
              <strong style="font-size: 15px; font-weight: bold;">
                ${options.showPaidStamp || ticket.status === 'completed' ? 'ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ' : 'ใบรับซ่อมโทรศัพท์มือถือ (REPAIR TICKET)'}
              </strong>
              <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">เลขที่: ${ticket.ticketId}</div>
              <div style="font-size: 11px;">วันที่: ${formatDateTime(ticket.createdAt)}</div>
            </div>

            <!-- Customer & Device Details -->
            <div style="font-size: 11px; margin-bottom: 8px; line-height: 1.5;">
              <div><strong>ชื่อลูกค้า:</strong> ${ticket.customer.name}</div>
              <div><strong>เบอร์โทร:</strong> ${ticket.customer.phone}</div>
              <div><strong>อุปกรณ์:</strong> ${ticket.device.brand} ${ticket.device.model} (${ticket.device.color || '-'})</div>
              <div><strong>IMEI/Serial:</strong> ${ticket.device.serialImei || '-'} | <strong>รหัสปลดล็อค:</strong> ${ticket.device.passcode || '-'}</div>
              <div><strong>อาการเสียที่แจ้ง:</strong> ${ticket.symptom}</div>
            </div>

            <!-- Items Table -->
            <table class="receipt-table">
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th style="text-align: center;">จำนวน</th>
                  <th style="text-align: right;">ราคา/หน่วย</th>
                  <th style="text-align: right;">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${ticket.partsUsed.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td style="text-align: center;">${p.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(p.price)}</td>
                    <td style="text-align: right;">${formatCurrency(p.price * p.quantity)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="3">ค่าบริการ / ค่าแรงช่างซ่อม</td>
                  <td style="text-align: right;">${formatCurrency(ticket.laborFee)}</td>
                </tr>
              </tbody>
            </table>

            <div class="receipt-divider"></div>

            <!-- Totals -->
            <div style="font-size: 11px; line-height: 1.6; text-align: right;">
              <div>ยอดรวมบริการ: ${formatCurrency(subtotal)}</div>
              ${ticket.discount > 0 ? `<div>ส่วนลดพิเศษ: -${formatCurrency(ticket.discount)}</div>` : ''}
              ${ticket.deposit > 0 ? `<div>มัดจำแล้ว: -${formatCurrency(ticket.deposit)}</div>` : ''}
              <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">
                ${options.showPaidStamp || ticket.status === 'completed' ? 'ชำระเงินแล้วสุทธิ:' : 'ยอดคงเหลือที่ต้องชำระ:'} 
                ${formatCurrency(netPayable)}
              </div>
            </div>

            <!-- Tracking QR Code -->
            <div style="text-align: center; margin-top: 12px; border-top: 1px dashed #000; padding-top: 8px;">
              <div style="font-size: 10px; font-weight: bold;">สแกน QR Code เพื่อเช็คสถานะการซ่อมแบบ Real-time</div>
              <div class="qr-code-container">
                <img src="${generateQrSvgUrl(trackingUrl, 120)}" alt="Tracking QR Code">
              </div>
            </div>

            <!-- Terms Footer -->
            <div class="receipt-footer">
              <div>*** เงื่อนไขการรับประกันงานซ่อม ***</div>
              <div>1. ใบรับซ่อมนี้ใช้เป็นหลักฐานในการรับเครื่องคืน</div>
              <div>2. รับประกันอะไหล่ที่เปลี่ยน 90 วัน (ยกเว้น ตกพื้น ตกน้ำ แกะซ่อมเอง)</div>
              <div>3. ขอบคุณที่ใช้บริการ ${shopInfo.name}</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-print-modal-btn">ปิด</button>
          <button class="btn btn-primary" id="btn-trigger-print"><i class="fas fa-print"></i> พิมพ์เอกสาร (Print)</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeHandler = () => modal.remove();
    modal.querySelector('#btn-close-print-modal').addEventListener('click', closeHandler);
    modal.querySelector('#btn-close-print-modal-btn').addEventListener('click', closeHandler);

    modal.querySelector('#btn-trigger-print').addEventListener('click', () => {
      window.print();
    });
  };
}
