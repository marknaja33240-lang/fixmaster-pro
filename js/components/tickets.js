/* ==========================================================================
   FixMaster Pro - Repair Tickets Management View & Modal Controllers
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, formatDateTime, getStatusMeta, generateTicketId, showToast } from '../utils/formatters.js';

export function renderTickets(container, router, options = {}) {
  let filterStatus = 'all';
  let searchQuery = '';

  function refreshList() {
    const allTickets = store.getTickets();
    let filtered = allTickets;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticketId.toLowerCase().includes(q) ||
        t.customer.name.toLowerCase().includes(q) ||
        t.customer.phone.includes(q) ||
        t.device.brand.toLowerCase().includes(q) ||
        t.device.model.toLowerCase().includes(q) ||
        (t.device.serialImei && t.device.serialImei.toLowerCase().includes(q))
      );
    }

    const tbody = container.querySelector('#tickets-tbody');
    if (tbody) {
      tbody.innerHTML = filtered.length === 0 ? `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-muted);"></i>
            <p>ไม่พบรายการใบรับซ่อมที่ค้นหา</p>
          </td>
        </tr>
      ` : filtered.map(t => {
        const statusMeta = getStatusMeta(t.status);
        const tech = store.getTechnicians().find(tech => tech.id === t.assignedTechId);
        return `
          <tr>
            <td>
              <strong style="color: var(--accent-primary); font-size: 0.95rem;">${t.ticketId}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDateTime(t.createdAt)}</div>
            </td>
            <td>
              <div style="font-weight: 600;">${t.customer.name}</div>
              <small style="color: var(--text-muted);"><i class="fas fa-phone-alt"></i> ${t.customer.phone}</small>
            </td>
            <td>
              <div style="font-weight: 600;">${t.device.brand} ${t.device.model}</div>
              <small style="color: var(--text-muted);">${t.device.color ? 'สี ' + t.device.color : ''} ${t.device.passcode ? '| รหัส: ' + t.device.passcode : ''}</small>
            </td>
            <td>
              <div style="max-width: 220px; font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${t.symptom}
              </div>
            </td>
            <td>
              <span class="badge ${statusMeta.badgeClass}">
                <i class="fas ${statusMeta.icon}"></i> ${statusMeta.label}
              </span>
            </td>
            <td>
              <div style="font-weight: 700; color: #22d3ee;">${formatCurrency(t.totalPrice)}</div>
              ${t.deposit > 0 ? `<small style="color: #34d399;">มัดจำแล้ว ${formatCurrency(t.deposit)}</small>` : ''}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-icon-only btn-view-ticket" data-id="${t.ticketId}" title="รายละเอียด & อัปเดต">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-primary btn-icon-only btn-print-ticket" data-id="${t.ticketId}" title="พิมพ์ใบรับซ่อม/สลิป">
                  <i class="fas fa-print"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Re-attach inline row button listeners
      tbody.querySelectorAll('.btn-view-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openTicketDetailModal(id);
        });
      });

      tbody.querySelectorAll('.btn-print-ticket').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          window.showPrintReceiptModal(id);
        });
      });
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1><i class="fas fa-ticket-alt" style="color: var(--accent-primary);"></i> ระบบจัดการใบรับซ่อม</h1>
        <p>บันทึกรับเครื่องซ่อม ตรวจเช็คอาการ อัปเดตสถานะ และออกใบรับซ่อมให้ลูกค้า</p>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-open-new-ticket">
          <i class="fas fa-plus-circle"></i> + ออกใบรับซ่อมใหม่
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="glass-panel" style="padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="status-filter-group">
        <button class="nav-btn active" data-status="all">ทั้งหมด</button>
        <button class="nav-btn" data-status="pending">รับเรื่องแล้ว</button>
        <button class="nav-btn" data-status="repairing">กำลังซ่อม</button>
        <button class="nav-btn" data-status="waiting_parts">รออะไหล่</button>
        <button class="nav-btn" data-status="ready">ซ่อมเสร็จรอรับ</button>
        <button class="nav-btn" data-status="completed">ส่งมอบแล้ว</button>
      </div>

      <div style="position: relative; width: 280px;">
        <i class="fas fa-search search-icon" style="top: 0.65rem;"></i>
        <input type="text" class="search-input" id="ticket-search-input" placeholder="ค้นหาตามเลขใบซ่อม, ชื่อ, เบอร์โทร, รุ่น..." style="width: 100%;">
      </div>
    </div>

    <!-- Tickets Table Panel -->
    <div class="glass-panel" style="padding: 1.25rem;">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>เลขใบซ่อม / วันที่</th>
              <th>ลูกค้า</th>
              <th>ยี่ห้อ / รุ่น</th>
              <th>อาการเสียที่แจ้ง</th>
              <th>สถานะซ่อม</th>
              <th>ประเมินราคา</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody id="tickets-tbody">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Container for dynamic modals -->
    <div id="modal-container"></div>
  `;

  // Filter click handlers
  const filterBtns = container.querySelectorAll('#status-filter-group .nav-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      filterStatus = e.currentTarget.getAttribute('data-status');
      refreshList();
    });
  });

  // Search input handler
  const searchInput = container.querySelector('#ticket-search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    refreshList();
  });

  // New Ticket Button
  container.querySelector('#btn-open-new-ticket').addEventListener('click', () => {
    openNewTicketModal();
  });

  // Check options if auto open modal
  if (options.action === 'new') {
    openNewTicketModal();
  } else if (options.viewId) {
    openTicketDetailModal(options.viewId);
  }

  refreshList();

  // Modal Renderers
  function openNewTicketModal() {
    const modalContainer = container.querySelector('#modal-container');
    const newId = generateTicketId(store.getTickets());
    const technicians = store.getTechnicians();
    const inventory = store.getInventory();

    modalContainer.innerHTML = `
      <div class="modal-backdrop active" id="new-ticket-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fas fa-file-medical" style="color: var(--accent-primary);"></i> ออกใบรับซ่อมใหม่ (${newId})</h3>
            <button class="modal-close" id="btn-close-modal">&times;</button>
          </div>

          <form id="form-create-ticket">
            <div class="modal-body">
              <!-- Customer Info Section -->
              <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--accent-secondary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="fas fa-user"></i> 1. ข้อมูลลูกค้า
              </h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
                  <input type="text" class="form-control" name="customerName" placeholder="เช่น คุณสมชาย ใจดี" required>
                </div>
                <div class="form-group">
                  <label class="form-label">เบอร์โทรศัพท์ <span class="required">*</span></label>
                  <input type="tel" class="form-control" name="customerPhone" placeholder="เช่น 089-123-4567" required>
                </div>
                <div class="form-group">
                  <label class="form-label">LINE ID (ถ้ามี)</label>
                  <input type="text" class="form-control" name="customerLine" placeholder="เช่น line_user">
                </div>
              </div>

              <!-- Device Info Section -->
              <h4 style="font-size: 0.95rem; margin-top: 1rem; margin-bottom: 0.75rem; color: var(--accent-secondary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="fas fa-mobile-alt"></i> 2. ข้อมูลตัวเครื่อง
              </h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">ยี่ห้อ (Brand) <span class="required">*</span></label>
                  <select class="form-control" name="deviceBrand" required>
                    <option value="Apple">Apple (iPhone / iPad)</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi / Poco / Redmi</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Realme">Realme</option>
                    <option value="Huawei">Huawei</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">รุ่น (Model) <span class="required">*</span></label>
                  <input type="text" class="form-control" name="deviceModel" placeholder="เช่น iPhone 15 Pro Max, S23 Ultra" required>
                </div>
                <div class="form-group">
                  <label class="form-label">สีเครื่อง</label>
                  <input type="text" class="form-control" name="deviceColor" placeholder="เช่น ดำ, Natural Titanium">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Serial Number / IMEI (15 หลัก)</label>
                  <input type="text" class="form-control" name="serialImei" placeholder="เลข IMEI ตัวเครื่อง">
                </div>
                <div class="form-group">
                  <label class="form-label">รหัสปลดล็อคเครื่อง / วาดรหัส</label>
                  <input type="text" class="form-control" name="passcode" placeholder="เช่น 123456 หรือ วาดรูป Z">
                </div>
              </div>

              <!-- Symptom & Checklist Section -->
              <h4 style="font-size: 0.95rem; margin-top: 1rem; margin-bottom: 0.75rem; color: var(--accent-secondary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="fas fa-notes-medical"></i> 3. อาการเสีย & ตรวจสภาพก่อนซ่อม (Pre-Checklist)
              </h4>
              <div class="form-group">
                <label class="form-label">อาการเสียที่แจ้ง / รายละเอียดที่พบ <span class="required">*</span></label>
                <textarea class="form-control" name="symptom" rows="2" placeholder="เช่น จอแตก ทัชสกรีนไม่ติด ชาร์จไฟไม่เข้า เครื่องตกน้ำ..." required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">ตารางเช็คสภาพฟังก์ชั่นตัวเครื่องก่อนรับซ่อม:</label>
                <div class="checklist-grid">
                  <label class="checklist-item"><input type="checkbox" name="chk_power" checked> เปิดติด</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_screenTouch" checked> จอแสดงผล/ทัช</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_charging" checked> ระบบชาร์จไฟ</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_cameraFront" checked> กล้องหน้า</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_cameraBack" checked> กล้องหลัง</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_wifi" checked> Wi-Fi / ซิม</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_speaker" checked> ลำโพงเสียง</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_microphone" checked> ไมโครโฟน</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_faceId" checked> FaceID / นิ้ว</label>
                  <label class="checklist-item"><input type="checkbox" name="chk_buttons" checked> ปุ่มกดข้าง</label>
                </div>
              </div>

              <!-- Parts & Price estimation -->
              <h4 style="font-size: 0.95rem; margin-top: 1rem; margin-bottom: 0.75rem; color: var(--accent-secondary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="fas fa-calculator"></i> 4. การประเมินราคา & มอบหมายช่าง
              </h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">เลือกอะไหล่เริ่มต้น (ถ้ามี)</label>
                  <select class="form-control" id="select-initial-part">
                    <option value="">-- ไม่ระบุ / รอช่างเช็ค --</option>
                    ${inventory.map(p => `<option value="${p.id}" data-price="${p.sellPrice}">${p.name} (฿${p.sellPrice}) - เหลือ ${p.stock}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ค่าแรง / ค่าบริการ (บาท)</label>
                  <input type="number" class="form-control" name="laborFee" value="500" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">เงินมัดจำ (บาท)</label>
                  <input type="number" class="form-control" name="deposit" value="0" min="0">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">ช่างรับผิดชอบ</label>
                  <select class="form-control" name="assignedTechId">
                    ${technicians.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-modal">ยกเลิก</button>
              <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> บันทึก & พิมพ์ใบรับซ่อม</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const modal = modalContainer.querySelector('#new-ticket-modal');
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => { modalContainer.innerHTML = ''; }, 300);
    };

    modal.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-modal').addEventListener('click', closeModal);

    // Submit handler
    modal.querySelector('#form-create-ticket').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const partSelect = modal.querySelector('#select-initial-part');
      const selectedPartId = partSelect.value;
      let partsUsed = [];
      let partsPriceTotal = 0;

      if (selectedPartId) {
        const partObj = store.getPartById(selectedPartId);
        if (partObj) {
          partsUsed.push({
            partId: partObj.id,
            name: partObj.name,
            quantity: 1,
            price: partObj.sellPrice
          });
          partsPriceTotal = partObj.sellPrice;
          store.updateStock(partObj.id, 1);
        }
      }

      const laborFee = parseFloat(formData.get('laborFee')) || 0;
      const deposit = parseFloat(formData.get('deposit')) || 0;
      const totalPrice = partsPriceTotal + laborFee;

      const newTicket = {
        ticketId: newId,
        createdAt: new Date().toISOString(),
        customer: {
          name: formData.get('customerName'),
          phone: formData.get('customerPhone'),
          lineId: formData.get('customerLine')
        },
        device: {
          brand: formData.get('deviceBrand'),
          model: formData.get('deviceModel'),
          color: formData.get('deviceColor'),
          serialImei: formData.get('serialImei'),
          passcode: formData.get('passcode')
        },
        symptom: formData.get('symptom'),
        preChecklist: {
          power: formData.get('chk_power') === 'on',
          screenTouch: formData.get('chk_screenTouch') === 'on',
          charging: formData.get('chk_charging') === 'on',
          cameraFront: formData.get('chk_cameraFront') === 'on',
          cameraBack: formData.get('chk_cameraBack') === 'on',
          wifi: formData.get('chk_wifi') === 'on',
          speaker: formData.get('chk_speaker') === 'on',
          microphone: formData.get('chk_microphone') === 'on',
          faceId: formData.get('chk_faceId') === 'on',
          buttons: formData.get('chk_buttons') === 'on'
        },
        assignedTechId: formData.get('assignedTechId'),
        status: 'pending',
        partsUsed: partsUsed,
        laborFee: laborFee,
        discount: 0,
        totalPrice: totalPrice,
        deposit: deposit,
        logs: [
          {
            time: new Date().toISOString(),
            status: 'pending',
            note: deposit > 0 ? `เปิดใบรับซ่อมใหม่ (รับเงินมัดจำ ${formatCurrency(deposit)})` : 'เปิดใบรับซ่อมใหม่'
          }
        ],
        technicianNote: ''
      };

      store.saveTicket(newTicket);
      showToast(`ออกใบรับซ่อมเรียบร้อย: ${newId}`, 'success');
      closeModal();
      refreshList();

      // Open print modal immediately
      window.showPrintReceiptModal(newId);
    });
  }

  function openTicketDetailModal(ticketId) {
    const ticket = store.getTicketById(ticketId);
    if (!ticket) return;

    const modalContainer = container.querySelector('#modal-container');
    const technicians = store.getTechnicians();
    const inventory = store.getInventory();
    const statusMeta = getStatusMeta(ticket.status);

    modalContainer.innerHTML = `
      <div class="modal-backdrop active" id="ticket-detail-modal">
        <div class="modal-dialog" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h3><i class="fas fa-wrench" style="color: var(--accent-primary);"></i> รายละเอียดใบรับซ่อม: ${ticket.ticketId}</h3>
              <small style="color: var(--text-muted);">รับเรื่องเมื่อ ${formatDateTime(ticket.createdAt)}</small>
            </div>
            <button class="modal-close" id="btn-close-modal">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Top Action & Status bar -->
            <div style="background: rgba(255, 255, 255, 0.04); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span class="form-label" style="margin:0;">สถานะปัจจุบัน:</span>
                <span class="badge ${statusMeta.badgeClass}" style="font-size: 0.9rem; padding: 0.4rem 0.85rem;">
                  <i class="fas ${statusMeta.icon}"></i> ${statusMeta.label}
                </span>
              </div>

              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label style="font-size: 0.85rem; color: var(--text-muted);">อัปเดตสถานะ:</label>
                <select class="form-control" id="select-change-status" style="width: 170px;">
                  <option value="pending" ${ticket.status === 'pending' ? 'selected' : ''}>รับเรื่องแล้ว</option>
                  <option value="diagnosing" ${ticket.status === 'diagnosing' ? 'selected' : ''}>กำลังตรวจเช็ค</option>
                  <option value="waiting_parts" ${ticket.status === 'waiting_parts' ? 'selected' : ''}>รออะไหล่</option>
                  <option value="repairing" ${ticket.status === 'repairing' ? 'selected' : ''}>กำลังซ่อม</option>
                  <option value="ready" ${ticket.status === 'ready' ? 'selected' : ''}>ซ่อมเสร็จรอรับ</option>
                  <option value="completed" ${ticket.status === 'completed' ? 'selected' : ''}>ส่งมอบ/ชำระเงินแล้ว</option>
                  <option value="cancelled" ${ticket.status === 'cancelled' ? 'selected' : ''}>ยกเลิกการซ่อม</option>
                </select>
              </div>
            </div>

            <!-- Customer & Device Overview -->
            <div class="grid-2col" style="margin-bottom: 1.25rem;">
              <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <h4 style="font-size: 0.9rem; color: var(--accent-secondary); margin-bottom: 0.5rem;"><i class="fas fa-user"></i> ข้อมูลลูกค้า</h4>
                <p><strong>ชื่อ:</strong> ${ticket.customer.name}</p>
                <p><strong>เบอร์โทร:</strong> <a href="tel:${ticket.customer.phone}" style="color: var(--accent-primary);">${ticket.customer.phone}</a></p>
                <p><strong>LINE ID:</strong> ${ticket.customer.lineId || '-'}</p>
              </div>

              <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <h4 style="font-size: 0.9rem; color: var(--accent-secondary); margin-bottom: 0.5rem;"><i class="fas fa-mobile-alt"></i> ข้อมูลตัวเครื่อง</h4>
                <p><strong>รุ่น:</strong> ${ticket.device.brand} ${ticket.device.model} (${ticket.device.color || 'ไม่ระบุสี'})</p>
                <p><strong>IMEI/Serial:</strong> ${ticket.device.serialImei || '-'}</p>
                <p><strong>รหัสผ่านเครื่อง:</strong> <span style="color: #fbbf24; font-weight: bold;">${ticket.device.passcode || '-'}</span></p>
              </div>
            </div>

            <!-- Symptom & Technician Note -->
            <div style="margin-bottom: 1.25rem;">
              <label class="form-label"><i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i> อาการเสียที่รับแจ้ง:</label>
              <div style="background: rgba(255,255,255,0.04); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
                ${ticket.symptom}
              </div>
            </div>

            <!-- Parts Used & Price Summary -->
            <div style="background: rgba(15, 23, 42, 0.4); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="font-size: 0.95rem; color: var(--accent-secondary);"><i class="fas fa-tools"></i> อะไหล่ที่ใช้ & รายการค่าบริการ</h4>
                <button class="btn btn-secondary" id="btn-add-part-to-ticket" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                  + เบิกอะไหล่เพิ่ม
                </button>
              </div>

              <table class="custom-table" style="font-size: 0.85rem; margin-bottom: 0.75rem;">
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th style="text-align: center;">จำนวน</th>
                    <th style="text-align: right;">ราคาต่อหน่วย</th>
                    <th style="text-align: right;">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticket.partsUsed.length === 0 ? `
                    <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">ยังไม่มีรายการอะไหล่</td></tr>
                  ` : ticket.partsUsed.map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td style="text-align: center;">${p.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(p.price)}</td>
                      <td style="text-align: right;">${formatCurrency(p.price * p.quantity)}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td colspan="3" style="text-align: right; font-weight: 600;">ค่าแรง / ค่าบริการ:</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(ticket.laborFee)}</td>
                  </tr>
                  ${ticket.discount > 0 ? `
                    <tr>
                      <td colspan="3" style="text-align: right; color: #ef4444;">ส่วนลดพิเศษ:</td>
                      <td style="text-align: right; color: #ef4444;">-${formatCurrency(ticket.discount)}</td>
                    </tr>
                  ` : ''}
                  <tr style="font-size: 1rem; font-weight: bold; background: rgba(99, 102, 241, 0.1);">
                    <td colspan="3" style="text-align: right;">ยอดรวมสุทธิ:</td>
                    <td style="text-align: right; color: #22d3ee;">${formatCurrency(ticket.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Repair Log History Timeline -->
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--accent-secondary);"><i class="fas fa-history"></i> ประวัติการอัปเดตงานซ่อม</h4>
            <div class="timeline">
              ${(ticket.logs || []).map(log => {
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
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-print-modal-ticket"><i class="fas fa-print"></i> พิมพ์ใบรับซ่อม/สลิป</button>
            ${ticket.status === 'ready' ? `<button class="btn btn-success" id="btn-checkout-ticket"><i class="fas fa-cash-register"></i> คิดเงิน / ส่งมอบเครื่อง</button>` : ''}
            <button class="btn btn-secondary" id="btn-close-detail">ปิดหน้าต่าง</button>
          </div>
        </div>
      </div>
    `;

    const modal = modalContainer.querySelector('#ticket-detail-modal');
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => { modalContainer.innerHTML = ''; }, 300);
    };

    modal.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-close-detail').addEventListener('click', closeModal);

    // Status Change listener
    modal.querySelector('#select-change-status').addEventListener('change', (e) => {
      const newStatus = e.target.value;
      const note = prompt('ระบุบันทึกเพิ่มเติมสำหรับสถานะนี้ (ถ้ามี):', '');
      store.updateTicketStatus(ticket.ticketId, newStatus, note || '');
      showToast(`อัปเดตสถานะเป็น "${getStatusMeta(newStatus).label}" เรียบร้อย`, 'success');
      closeModal();
      refreshList();
    });

    // Add part dynamically
    modal.querySelector('#btn-add-part-to-ticket').addEventListener('click', () => {
      const partId = prompt(`กรอก ID อะไหล่ หรือเลือกจากคลัง:\n${inventory.map(p => `${p.id}: ${p.name} (฿${p.sellPrice})`).join('\n')}`);
      if (partId) {
        const part = store.getPartById(partId.trim());
        if (part) {
          ticket.partsUsed.push({
            partId: part.id,
            name: part.name,
            quantity: 1,
            price: part.sellPrice
          });
          const partsSum = ticket.partsUsed.reduce((s, p) => s + (p.price * p.quantity), 0);
          ticket.totalPrice = partsSum + ticket.laborFee - ticket.discount;
          store.saveTicket(ticket);
          store.updateStock(part.id, 1);
          showToast(`เพิ่มอะไหล่ ${part.name} เข้าใบรับซ่อมเรียบร้อย`, 'success');
          openTicketDetailModal(ticket.ticketId);
        } else {
          alert('ไม่พบรหัสอะไหล่ดังกล่าว');
        }
      }
    });

    // Print Receipt
    modal.querySelector('#btn-print-modal-ticket').addEventListener('click', () => {
      window.showPrintReceiptModal(ticket.ticketId);
    });

    // Checkout button
    modal.querySelector('#btn-checkout-ticket')?.addEventListener('click', () => {
      closeModal();
      router('pos', { ticketId: ticket.ticketId });
    });
  }
}
