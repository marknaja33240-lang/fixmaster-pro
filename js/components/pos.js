/* ==========================================================================
   FixMaster Pro - POS Cashier & Payment Checkout View
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast } from '../utils/formatters.js';
import { generatePromptPayPayload, generateQrSvgUrl } from '../utils/qrGenerator.js';

export function renderPos(container, router, options = {}) {
  const shopInfo = store.getShopInfo();
  let selectedTicketId = options.ticketId || null;
  let paymentMethod = 'promptpay'; // 'cash', 'promptpay', 'card'
  let cashReceived = 0;
  let discountAmount = 0;

  function refreshPosView() {
    const readyTickets = store.getTickets().filter(t => t.status === 'ready' || t.status === 'repairing' || t.ticketId === selectedTicketId);
    const selectedTicket = selectedTicketId ? store.getTicketById(selectedTicketId) : (readyTickets.length > 0 ? readyTickets[0] : null);

    if (selectedTicket && !selectedTicketId) {
      selectedTicketId = selectedTicket.ticketId;
    }

    const subtotal = selectedTicket ? selectedTicket.partsUsed.reduce((s, p) => s + (p.price * p.quantity), 0) + selectedTicket.laborFee : 0;
    const finalDiscount = (selectedTicket ? selectedTicket.discount : 0) + discountAmount;
    const depositPaid = selectedTicket ? (selectedTicket.deposit || 0) : 0;
    const netPayable = Math.max(0, subtotal - finalDiscount - depositPaid);
    const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashReceived - netPayable) : 0;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1><i class="fas fa-cash-register" style="color: var(--accent-primary);"></i> ระบบรับชำระเงิน & ออกใบเสร็จ (POS)</h1>
          <p>ส่งมอบเครื่องซ่อม รับชำระเงินสแกน PromptPay QR / เงินสด และออกสลิปใบเสร็จ</p>
        </div>
      </div>

      <div class="grid-2col">
        <!-- Left: Ticket Selector & Items Summary -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- Ticket Selector Dropdown -->
          <div class="glass-panel" style="padding: 1.25rem;">
            <label class="form-label" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-secondary);">
              <i class="fas fa-search"></i> เลือกรายการใบรับซ่อมที่พร้อมรับเครื่อง:
            </label>
            <select class="form-control" id="select-pos-ticket" style="font-size: 1rem; padding: 0.75rem; font-weight: 600;">
              ${readyTickets.length === 0 ? `
                <option value="">-- ไม่พบรายการที่พร้อมส่งมอบ --</option>
              ` : readyTickets.map(t => `
                <option value="${t.ticketId}" ${t.ticketId === selectedTicketId ? 'selected' : ''}>
                  ${t.ticketId} - ${t.customer.name} (${t.device.brand} ${t.device.model}) - ยอดชำระ ฿${t.totalPrice - t.deposit}
                </option>
              `).join('')}
            </select>
          </div>

          ${!selectedTicket ? `
            <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--text-muted);">
              <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-muted);"></i>
              <h3>ไม่มีรายการซ่อมที่เลือก</h3>
              <p style="margin-top: 0.5rem;">กรุณาเลือกใบรับซ่อมเพื่อทำการชำระเงิน</p>
            </div>
          ` : `
            <!-- Ticket Info & Line Items Table -->
            <div class="glass-panel" style="padding: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                <div>
                  <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">${selectedTicket.ticketId}</h3>
                  <div style="font-size: 0.9rem; margin-top: 0.2rem;"><strong>ลูกค้า:</strong> ${selectedTicket.customer.name} (${selectedTicket.customer.phone})</div>
                  <div style="font-size: 0.88rem; color: var(--text-muted);"><strong>ตัวเครื่อง:</strong> ${selectedTicket.device.brand} ${selectedTicket.device.model}</div>
                </div>
                <div style="text-align: right;">
                  <span class="badge badge-ready" style="font-size: 0.85rem;"><i class="fas fa-check-circle"></i> พร้อมส่งมอบ</span>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">รับเครื่องเมื่อ: ${selectedTicket.createdAt.split('T')[0]}</div>
                </div>
              </div>

              <!-- Items Table -->
              <table class="custom-table" style="font-size: 0.88rem; margin-bottom: 1rem;">
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th style="text-align: center;">จำนวน</th>
                    <th style="text-align: right;">ราคาต่อหน่วย</th>
                    <th style="text-align: right;">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedTicket.partsUsed.map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td style="text-align: center;">${p.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(p.price)}</td>
                      <td style="text-align: right;">${formatCurrency(p.price * p.quantity)}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td colspan="3" style="text-align: right; font-weight: 600;">ค่าแรง / บริการซ่อม:</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(selectedTicket.laborFee)}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                  <span style="color: var(--text-muted);">รวมค่าอะไหล่ & ค่าบริการ:</span>
                  <span>${formatCurrency(subtotal)}</span>
                </div>
                ${depositPaid > 0 ? `
                  <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #10b981;">
                    <span>หัก เงินมัดจำชำระแล้ว:</span>
                    <span>-${formatCurrency(depositPaid)}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                  <span style="color: var(--text-muted);">ส่วนลดเพิ่มเติม (บาท):</span>
                  <input type="number" class="form-control" id="input-extra-discount" value="${discountAmount}" min="0" style="width: 110px; text-align: right; padding: 0.3rem 0.6rem;">
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 0.75rem; color: #22d3ee;">
                  <span>ยอดชำระสุทธิ:</span>
                  <span>${formatCurrency(netPayable)}</span>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- Right Column: Payment Method & Dynamic QR -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${!selectedTicket ? '' : `
            <div class="glass-panel" style="padding: 1.5rem;">
              <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent-primary); display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-wallet"></i> เลือกช่องทางชำระเงิน
              </h3>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.25rem;">
                <button class="nav-btn ${paymentMethod === 'promptpay' ? 'active' : ''}" id="btn-pay-promptpay" style="flex-direction: column; padding: 0.75rem 0.5rem; text-align: center;">
                  <i class="fas fa-qrcode" style="font-size: 1.4rem; margin-bottom: 0.25rem;"></i>
                  <span>PromptPay QR</span>
                </button>
                <button class="nav-btn ${paymentMethod === 'cash' ? 'active' : ''}" id="btn-pay-cash" style="flex-direction: column; padding: 0.75rem 0.5rem; text-align: center;">
                  <i class="fas fa-money-bill-wave" style="font-size: 1.4rem; margin-bottom: 0.25rem;"></i>
                  <span>เงินสด (Cash)</span>
                </button>
                <button class="nav-btn ${paymentMethod === 'card' ? 'active' : ''}" id="btn-pay-card" style="flex-direction: column; padding: 0.75rem 0.5rem; text-align: center;">
                  <i class="fas fa-credit-card" style="font-size: 1.4rem; margin-bottom: 0.25rem;"></i>
                  <span>บัตรเครดิต/โอน</span>
                </button>
              </div>

              <!-- Payment Details Display -->
              ${paymentMethod === 'promptpay' ? `
                <div style="text-align: center; background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
                  <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">สแกน QR Code ชำระเงิน (PromptPay)</h4>
                  <div style="background: #fff; padding: 12px; display: inline-block; border-radius: var(--radius-sm); box-shadow: var(--shadow-md);">
                    <img src="${generateQrSvgUrl(generatePromptPayPayload(shopInfo.promptpay, netPayable), 180)}" alt="PromptPay QR Code" style="width: 170px; height: 170px; display: block;">
                  </div>
                  <div style="font-weight: 700; margin-top: 0.5rem; font-size: 0.95rem; color: var(--text-main);">${shopInfo.promptpayName}</div>
                  <div style="font-size: 0.82rem; color: var(--text-muted);">เลขพร้อมเพย์: ${shopInfo.promptpay}</div>
                  <div style="font-size: 1.2rem; font-weight: bold; color: #10b981; margin-top: 0.4rem;">ยอดชำระ: ${formatCurrency(netPayable)}</div>
                </div>
              ` : ''}

              ${paymentMethod === 'cash' ? `
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
                  <div class="form-group">
                    <label class="form-label">รับเงินสดมา (บาท):</label>
                    <input type="number" class="form-control" id="input-cash-received" value="${cashReceived || ''}" placeholder="ระบุจำนวนเงินที่รับมา..." style="font-size: 1.2rem; font-weight: bold;">
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: bold; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                    <span>เงินทอน:</span>
                    <span style="color: ${cashReceived >= netPayable ? '#10b981' : '#ef4444'};">${formatCurrency(changeAmount)}</span>
                  </div>
                </div>
              ` : ''}

              ${paymentMethod === 'card' ? `
                <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 1.25rem; text-align: center;">
                  <i class="fas fa-credit-card" style="font-size: 2rem; color: var(--accent-secondary); margin-bottom: 0.5rem;"></i>
                  <p style="font-size: 0.9rem;">รูดบัตรผ่านเครื่อง EDC / โอนเงินเข้าบัญชีธนาคารร้าน</p>
                </div>
              ` : ''}

              <button class="btn btn-success" id="btn-complete-checkout" style="width: 100%; padding: 0.85rem; font-size: 1.1rem; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);">
                <i class="fas fa-check-circle"></i> ยืนยันชำระเงิน & ออกสลิปใบเสร็จ
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    // Dropdown change listener
    const selectPos = container.querySelector('#select-pos-ticket');
    if (selectPos) {
      selectPos.addEventListener('change', (e) => {
        selectedTicketId = e.target.value;
        discountAmount = 0;
        cashReceived = 0;
        refreshPosView();
      });
    }

    // Extra discount change
    const extraDiscInput = container.querySelector('#input-extra-discount');
    if (extraDiscInput) {
      extraDiscInput.addEventListener('input', (e) => {
        discountAmount = parseFloat(e.target.value) || 0;
        refreshPosView();
      });
    }

    // Payment method buttons
    container.querySelector('#btn-pay-promptpay')?.addEventListener('click', () => { paymentMethod = 'promptpay'; refreshPosView(); });
    container.querySelector('#btn-pay-cash')?.addEventListener('click', () => { paymentMethod = 'cash'; refreshPosView(); });
    container.querySelector('#btn-pay-card')?.addEventListener('click', () => { paymentMethod = 'card'; refreshPosView(); });

    // Cash received input
    const cashInput = container.querySelector('#input-cash-received');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        cashReceived = parseFloat(e.target.value) || 0;
        const changeSpan = container.querySelector('#input-cash-received')?.parentElement?.nextElementSibling?.lastElementChild;
        if (changeSpan) {
          const change = Math.max(0, cashReceived - netPayable);
          changeSpan.innerText = formatCurrency(change);
          changeSpan.style.color = cashReceived >= netPayable ? '#10b981' : '#ef4444';
        }
      });
    }

    // Checkout Submit button
    container.querySelector('#btn-complete-checkout')?.addEventListener('click', () => {
      if (!selectedTicket) return;

      if (paymentMethod === 'cash' && cashReceived < netPayable) {
        showToast('จำนวนเงินสดที่รับมาไม่เพียงพอต่อยอดชำระ', 'warning');
        return;
      }

      // Update ticket discount and status to completed
      selectedTicket.discount += discountAmount;
      store.saveTicket(selectedTicket);
      store.updateTicketStatus(selectedTicket.ticketId, 'completed', `ชำระเงินเรียบร้อยผ่าน ${paymentMethod.toUpperCase()}`);

      showToast(`ชำระเงินและส่งมอบเครื่องเรียบร้อย: ${selectedTicket.ticketId}`, 'success');

      // Open print slip modal
      window.showPrintReceiptModal(selectedTicket.ticketId, { showPaidStamp: true });

      // Refresh view
      selectedTicketId = null;
      refreshPosView();
    });
  }

  refreshPosView();
}
