/* ==========================================================================
   FixMaster Pro - Dashboard View Component
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDateTime, getStatusMeta } from '../utils/formatters.js';

export function renderDashboard(container, router) {
  const tickets = store.getTickets();
  const inventory = store.getInventory();
  const technicians = store.getTechnicians();

  // Metrics Calculation
  const totalCount = tickets.length;
  const repairingCount = tickets.filter(t => ['repairing', 'diagnosing', 'waiting_parts'].includes(t.status)).length;
  const readyCount = tickets.filter(t => t.status === 'ready').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  
  // Total Revenue calculation
  const totalRevenue = tickets
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.totalPrice || 0), 0);

  const estimatedPendingRevenue = tickets
    .filter(t => ['repairing', 'diagnosing', 'ready'].includes(t.status))
    .reduce((sum, t) => sum + (t.totalPrice || 0), 0);

  // Low stock inventory items
  const lowStockItems = inventory.filter(p => p.stock <= p.minStock);

  // Recent 5 tickets
  const recentTickets = [...tickets].slice(0, 5);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1><i class="fas fa-chart-line" style="color: var(--accent-primary);"></i> Dashboard Overview</h1>
        <p>สรุปภาพรวมงานซ่อม รายได้ และสถานะคลังอะไหล่ประจำวัน</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-primary" id="btn-quick-new-ticket">
          <i class="fas fa-plus-circle"></i> ออกใบรับซ่อมใหม่
        </button>
        <button class="btn btn-secondary" id="btn-quick-track">
          <i class="fas fa-search"></i> เช็คสถานะซ่อม
        </button>
      </div>
    </div>

    <!-- 4 Stats Cards -->
    <div class="grid-stats">
      <div class="glass-panel stat-card pending">
        <div class="stat-info">
          <h4>งานซ่อมทั้งหมด</h4>
          <div class="stat-value">${totalCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">รายการ</span></div>
          <div class="stat-desc">เสร็จสิ้นแล้ว ${completedCount} รายการ</div>
        </div>
        <div class="stat-icon-wrapper" style="color: var(--status-pending);">
          <i class="fas fa-clipboard-list"></i>
        </div>
      </div>

      <div class="glass-panel stat-card repairing">
        <div class="stat-info">
          <h4>กำลังดำเนินการซ่อม</h4>
          <div class="stat-value" style="color: #60a5fa;">${repairingCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">เครื่อง</span></div>
          <div class="stat-desc">อยู่ระหว่างตรวจเช็ค & เปลี่ยนอะไหล่</div>
        </div>
        <div class="stat-icon-wrapper" style="color: var(--status-repairing);">
          <i class="fas fa-tools"></i>
        </div>
      </div>

      <div class="glass-panel stat-card ready">
        <div class="stat-info">
          <h4>ซ่อมเสร็จรอรับเครื่อง</h4>
          <div class="stat-value" style="color: #34d399;">${readyCount} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted);">เครื่อง</span></div>
          <div class="stat-desc">ผ่าน QC พร้อมส่งมอบลูกค้า</div>
        </div>
        <div class="stat-icon-wrapper" style="color: var(--status-ready);">
          <i class="fas fa-check-double"></i>
        </div>
      </div>

      <div class="glass-panel stat-card completed">
        <div class="stat-info">
          <h4>รายได้สะสม (ชำระแล้ว)</h4>
          <div class="stat-value" style="color: #22d3ee;">${formatCurrency(totalRevenue)}</div>
          <div class="stat-desc">ประมาณการรับเพิ่ม ${formatCurrency(estimatedPendingRevenue)}</div>
        </div>
        <div class="stat-icon-wrapper" style="color: var(--status-completed);">
          <i class="fas fa-coins"></i>
        </div>
      </div>
    </div>

    <!-- Main Content 2 Columns -->
    <div class="grid-2col">
      <!-- Left: Recent Tickets Table -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-history" style="color: var(--accent-secondary);"></i> รายการซ่อมล่าสุด
          </h3>
          <button class="btn btn-secondary" id="btn-view-all-tickets" style="padding: 0.4rem 0.8rem; font-size: 0.82rem;">
            ดูทั้งหมด (${tickets.length}) <i class="fas fa-arrow-right"></i>
          </button>
        </div>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>เลขใบซ่อม</th>
                <th>ลูกค้า</th>
                <th>อุปกรณ์ / รุ่น</th>
                <th>สถานะ</th>
                <th>ประเมินราคา</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${recentTickets.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    ยังไม่มีข้อมูลใบรับซ่อม
                  </td>
                </tr>
              ` : recentTickets.map(t => {
                const statusMeta = getStatusMeta(t.status);
                return `
                  <tr>
                    <td><strong style="color: var(--accent-primary);">${t.ticketId}</strong></td>
                    <td>
                      <div>${t.customer.name}</div>
                      <small style="color: var(--text-muted);">${t.customer.phone}</small>
                    </td>
                    <td>
                      <div><strong>${t.device.brand}</strong> ${t.device.model}</div>
                      <small style="color: var(--text-muted);">${t.device.color || ''}</small>
                    </td>
                    <td>
                      <span class="badge ${statusMeta.badgeClass}">
                        <i class="fas ${statusMeta.icon}"></i> ${statusMeta.label}
                      </span>
                    </td>
                    <td><strong>${formatCurrency(t.totalPrice)}</strong></td>
                    <td>
                      <button class="btn btn-secondary btn-icon-only btn-detail-ticket" data-id="${t.ticketId}" title="รายละเอียด">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: Low Stock Alerts & Quick Tools -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Low Stock Alert -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: #f59e0b;">
            <i class="fas fa-exclamation-triangle"></i> อะไหล่ใกล้หมดสต็อก (${lowStockItems.length})
          </h3>
          
          ${lowStockItems.length === 0 ? `
            <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
              <i class="fas fa-check-circle" style="font-size: 2rem; color: #10b981; margin-bottom: 0.5rem;"></i>
              <p>สต็อกอะไหล่ทุกรายการเพียงพอ</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${lowStockItems.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.03); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                  <div>
                    <div style="font-size: 0.88rem; font-weight: 600;">${p.name}</div>
                    <small style="color: var(--text-muted);">${p.brand} - ${p.model}</small>
                  </div>
                  <span class="badge badge-cancelled" style="font-size: 0.82rem;">
                    เหลือ ${p.stock} ${p.unit}
                  </span>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-secondary" id="btn-goto-inventory" style="width: 100%; margin-top: 1rem;">
              <i class="fas fa-boxes"></i> ไปที่ระบบคลังอะไหล่
            </button>
          `}
        </div>

        <!-- Quick System Settings / Technicians list -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <i class="fas fa-user-shield" style="color: var(--accent-primary);"></i> ทีมช่างประจำร้าน
          </h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${technicians.map(tech => `
              <div style="display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm);">
                <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">
                  ${tech.name.charAt(0)}
                </div>
                <div>
                  <div style="font-size: 0.88rem; font-weight: 600;">${tech.name}</div>
                  <small style="color: var(--text-muted);">${tech.phone}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Event Listeners
  document.getElementById('btn-quick-new-ticket')?.addEventListener('click', () => {
    router('tickets', { action: 'new' });
  });

  document.getElementById('btn-quick-track')?.addEventListener('click', () => {
    router('tracker');
  });

  document.getElementById('btn-view-all-tickets')?.addEventListener('click', () => {
    router('tickets');
  });

  document.getElementById('btn-goto-inventory')?.addEventListener('click', () => {
    router('inventory');
  });

  container.querySelectorAll('.btn-detail-ticket').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ticketId = e.currentTarget.getAttribute('data-id');
      router('tickets', { viewId: ticketId });
    });
  });
}
