/* ==========================================================================
   FixMaster Pro - Customer Live Status Tracker Portal View
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDateTime, getStatusMeta } from '../utils/formatters.js';

export function renderTracker(container, router, options = {}) {
  let searchInputText = options.query || '';
  let foundTicket = searchInputText ? store.getTicketById(searchInputText) : null;

  function refreshTrackerView() {
    container.innerHTML = `
      <div style="max-width: 760px; margin: 0 auto;">
        <div class="page-header" style="text-align: center; display: block; margin-bottom: 2rem;">
          <h1 style="font-size: 2rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; justify-content: center;">
            <i class="fas fa-search-location"></i> Customer Live Status Portal
          </h1>
          <p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 1rem;">
            ระบบติดตามสถานะการซ่อมโทรศัพท์มือถือสำหรับลูกค้าแบบ Real-time
          </p>
        </div>

        <!-- Search Box Panel -->
        <div class="glass-panel" style="padding: 1.75rem; margin-bottom: 2rem;">
          <form id="form-search-tracker">
            <label class="form-label" style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">
              กรอกเลขใบรับซ่อม (เช่น FIX-2026-001) หรือ เบอร์โทรศัพท์:
            </label>
            <div style="display: flex; gap: 0.75rem;">
              <input type="text" class="form-control" id="tracker-input-query" value="${searchInputText}" placeholder="เช่น FIX-2026-001 หรือ 0891234567" style="font-size: 1.1rem; padding: 0.75rem;" required>
              <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 1rem; white-space: nowrap;">
                <i class="fas fa-search"></i> ค้นหาสถานะ
              </button>
            </div>
          </form>
        </div>

        ${foundTicket ? renderSearchResultPanel(foundTicket) : (searchInputText ? `
          <div class="glass-panel" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            <i class="fas fa-times-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <h3>ไม่พบข้อมูลใบรับซ่อมสำหรับ: "${searchInputText}"</h3>
            <p style="margin-top: 0.5rem;">โปรดตรวจสอบเลขใบรับซ่อมหรือเบอร์โทรศัพท์อีกครั้ง หรือติดต่อทางร้านที่เบอร์ 089-123-4567</p>
          </div>
        ` : '')}
      </div>
    `;

    // Form search submit
    container.querySelector('#form-search-tracker')?.addEventListener('submit', (e) => {
      e.preventDefault();
      searchInputText = container.querySelector('#tracker-input-query').value.trim();
      if (searchInputText) {
        // Try ticket ID or phone
        foundTicket = store.getTicketById(searchInputText);
        if (!foundTicket) {
          foundTicket = store.getTickets().find(t => t.customer.phone.replace(/[^0-9]/g, '').includes(searchInputText.replace(/[^0-9]/g, '')));
        }
        refreshTrackerView();
      }
    });
  }

  function renderSearchResultPanel(t) {
    const statusMeta = getStatusMeta(t.status);
    const tech = store.getTechnicians().find(tech => tech.id === t.assignedTechId);

    return `
      <div class="glass-panel" style="padding: 1.75rem; margin-bottom: 2rem;">
        <!-- Top Status Banner -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary);">${t.ticketId}</h3>
            <small style="color: var(--text-muted);">รับเรื่องเมื่อ: ${formatDateTime(t.createdAt)}</small>
          </div>
          <span class="badge ${statusMeta.badgeClass}" style="font-size: 1rem; padding: 0.5rem 1rem;">
            <i class="fas ${statusMeta.icon}"></i> ${statusMeta.label}
          </span>
        </div>

        <!-- Customer & Device Info -->
        <div class="grid-2col" style="margin-bottom: 1.5rem;">
          <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <h4 style="font-size: 0.88rem; color: var(--text-muted); text-transform: uppercase;"><i class="fas fa-mobile-alt"></i> อุปกรณ์ซ่อม</h4>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 0.3rem;">${t.device.brand} ${t.device.model}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${t.device.color ? 'สี ' + t.device.color : ''}</div>
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <h4 style="font-size: 0.88rem; color: var(--text-muted); text-transform: uppercase;"><i class="fas fa-user-shield"></i> ผู้รับดูแล</h4>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 0.3rem;">${tech ? tech.name : 'ช่างประจำร้าน'}</div>
            <div style="font-size: 0.85rem; color: #10b981;">ประเมินราคา: ${formatCurrency(t.totalPrice)}</div>
          </div>
        </div>

        <!-- Live Progress Timeline -->
        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent-secondary);"><i class="fas fa-route"></i> Timeline ขั้นตอนการซ่อมแบบ Real-time</h4>
        <div class="timeline" style="margin-bottom: 1.5rem;">
          ${(t.logs || []).map(log => {
            const logMeta = getStatusMeta(log.status);
            return `
              <div class="timeline-item active">
                <div class="timeline-dot"><i class="fas ${logMeta.icon}"></i></div>
                <div class="timeline-content">
                  <span class="timeline-time">${formatDateTime(log.time)}</span>
                  <div class="timeline-title">${logMeta.label}</div>
                  <div class="timeline-desc">${log.note || ''}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Contact Shop Button -->
        <div style="text-align: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.75rem;">มีข้อสงสัยเกี่ยวกับงานซ่อม ติดต่อสอบถามช่างผู้ดูแล:</p>
          <a href="tel:0891234567" class="btn btn-secondary" style="margin-right: 0.5rem;"><i class="fas fa-phone-alt"></i> โทร 089-123-4567</a>
          <a href="https://line.me" target="_blank" class="btn btn-success"><i class="fab fa-line"></i> สอบถามผ่าน LINE</a>
        </div>
      </div>
    `;
  }

  refreshTrackerView();
}
