/* ==========================================================================
   FixMaster Pro - Spare Parts Inventory Management View
   ========================================================================== */

import { store } from '../store.js';
import { formatCurrency, showToast } from '../utils/formatters.js';

export function renderInventory(container, router) {
  let selectedCategory = 'all';
  let searchQuery = '';

  function refreshInventoryTable() {
    const inventory = store.getInventory();
    let filtered = inventory;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
      );
    }

    const tbody = container.querySelector('#inventory-tbody');
    if (tbody) {
      tbody.innerHTML = filtered.length === 0 ? `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            <i class="fas fa-boxes" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-muted);"></i>
            <p>ไม่พบรายการอะไหล่ในคลัง</p>
          </td>
        </tr>
      ` : filtered.map(p => {
        const isLowStock = p.stock <= p.minStock;
        return `
          <tr>
            <td><code style="color: var(--accent-primary); font-weight: bold;">${p.id}</code></td>
            <td>
              <div style="font-weight: 600;">${p.name}</div>
              <small style="color: var(--text-muted);">${p.brand} - ${p.model}</small>
            </td>
            <td><span class="badge badge-secondary">${p.category}</span></td>
            <td><small style="color: var(--text-muted);">${formatCurrency(p.costPrice)}</small></td>
            <td><strong style="color: #22d3ee;">${formatCurrency(p.sellPrice)}</strong></td>
            <td>
              <span class="badge ${isLowStock ? 'badge-cancelled' : 'badge-ready'}" style="font-size: 0.85rem;">
                ${p.stock} ${p.unit || 'ชิ้น'} ${isLowStock ? '(สต็อกต่ำ)' : ''}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 0.25rem;">
                <button class="btn btn-secondary btn-icon-only btn-adjust-stock" data-id="${p.id}" data-action="minus" title="ลด 1 ชิ้น">-</button>
                <button class="btn btn-secondary btn-icon-only btn-adjust-stock" data-id="${p.id}" data-action="plus" title="เพิ่ม 1 ชิ้น">+</button>
              </div>
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-icon-only btn-edit-part" data-id="${p.id}" title="แก้ไข">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon-only btn-delete-part" data-id="${p.id}" title="ลบ">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row action handlers
      tbody.querySelectorAll('.btn-adjust-stock').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const action = e.currentTarget.getAttribute('data-action');
          const part = store.getPartById(id);
          if (part) {
            if (action === 'plus') part.stock += 1;
            if (action === 'minus') part.stock = Math.max(0, part.stock - 1);
            store.savePart(part);
            refreshInventoryTable();
          }
        });
      });

      tbody.querySelectorAll('.btn-edit-part').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openPartModal(id);
        });
      });

      tbody.querySelectorAll('.btn-delete-part').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('ยืนยันการลบรายการอะไหล่นี้ออกจากคลัง?')) {
            store.deletePart(id);
            showToast('ลบรายการอะไหล่เรียบร้อย', 'warning');
            refreshInventoryTable();
          }
        });
      });
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1><i class="fas fa-boxes" style="color: var(--accent-primary);"></i> คลังอะไหล่ & อุปกรณ์ซ่อม</h1>
        <p>บริหารจัดการสต็อกอะไหล่ ราคาทุน ราคาขาย และระบบเตือนสต็อกขั้นต่ำ</p>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-add-new-part">
          <i class="fas fa-plus-circle"></i> + เพิ่มรายการอะไหล่ใหม่
        </button>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="glass-panel" style="padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="category-filter-group">
        <button class="nav-btn active" data-cat="all">หมวดหมู่ทั้งหมด</button>
        <button class="nav-btn" data-cat="Display">หน้าจอ (Display)</button>
        <button class="nav-btn" data-cat="Battery">แบตเตอรี่ (Battery)</button>
        <button class="nav-btn" data-cat="Charging Port">ตูดชาร์จ (Charging)</button>
        <button class="nav-btn" data-cat="Camera/Lens">กล้อง/กระจกเลนส์</button>
        <button class="nav-btn" data-cat="IC/Chip">ชิป/IC บอร์ด</button>
      </div>

      <div style="position: relative; width: 280px;">
        <i class="fas fa-search search-icon" style="top: 0.65rem;"></i>
        <input type="text" class="search-input" id="inventory-search-input" placeholder="ค้นหาชื่ออะไหล่, ยี่ห้อ, รุ่น..." style="width: 100%;">
      </div>
    </div>

    <!-- Table Panel -->
    <div class="glass-panel" style="padding: 1.25rem;">
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>รหัสอะไหล่</th>
              <th>ชื่อรายการอะไหล่</th>
              <th>หมวดหมู่</th>
              <th>ราคาทุน</th>
              <th>ราคาขาย</th>
              <th>คงเหลือในสต็อก</th>
              <th>ปรับสต็อก</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody id="inventory-tbody">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>

    <div id="modal-inventory-container"></div>
  `;

  // Category filter handlers
  const categoryBtns = container.querySelectorAll('#category-filter-group .nav-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      selectedCategory = e.currentTarget.getAttribute('data-cat');
      refreshInventoryTable();
    });
  });

  // Search input handler
  container.querySelector('#inventory-search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    refreshInventoryTable();
  });

  // Add Part Button
  container.querySelector('#btn-add-new-part').addEventListener('click', () => {
    openPartModal();
  });

  refreshInventoryTable();

  // Part Modal Renderer
  function openPartModal(partId = null) {
    const modalContainer = container.querySelector('#modal-inventory-container');
    const existing = partId ? store.getPartById(partId) : null;

    modalContainer.innerHTML = `
      <div class="modal-backdrop active" id="part-modal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fas fa-box-open" style="color: var(--accent-primary);"></i> ${existing ? 'แก้ไขรายการอะไหล่' : 'เพิ่มรายการอะไหล่ใหม่'}</h3>
            <button class="modal-close" id="btn-close-modal">&times;</button>
          </div>

          <form id="form-part">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">ชื่อรายการอะไหล่ <span class="required">*</span></label>
                <input type="text" class="form-control" name="name" value="${existing ? existing.name : ''}" placeholder="เช่น หน้าจอ OLED iPhone 15 Pro Max" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">หมวดหมู่ <span class="required">*</span></label>
                  <select class="form-control" name="category" required>
                    <option value="Display" ${existing && existing.category === 'Display' ? 'selected' : ''}>หน้าจอ (Display)</option>
                    <option value="Battery" ${existing && existing.category === 'Battery' ? 'selected' : ''}>แบตเตอรี่ (Battery)</option>
                    <option value="Charging Port" ${existing && existing.category === 'Charging Port' ? 'selected' : ''}>ตูดชาร์จ (Charging Port)</option>
                    <option value="Camera/Lens" ${existing && existing.category === 'Camera/Lens' ? 'selected' : ''}>กล้อง/เลนส์กระจก</option>
                    <option value="IC/Chip" ${existing && existing.category === 'IC/Chip' ? 'selected' : ''}>ชิป / IC / บอร์ด</option>
                    <option value="Flex Cable" ${existing && existing.category === 'Flex Cable' ? 'selected' : ''}>แพรปุ่มกด/ลำโพง</option>
                    <option value="Accessories" ${existing && existing.category === 'Accessories' ? 'selected' : ''}>อุปกรณ์เสริม</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ยี่ห้อ (Brand)</label>
                  <input type="text" class="form-control" name="brand" value="${existing ? existing.brand : ''}" placeholder="เช่น Apple, Samsung">
                </div>
                <div class="form-group">
                  <label class="form-label">รองรับรุ่น (Model)</label>
                  <input type="text" class="form-control" name="model" value="${existing ? existing.model : ''}" placeholder="เช่น iPhone 15 Pro Max">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">ราคาทุน (บาท) <span class="required">*</span></label>
                  <input type="number" class="form-control" name="costPrice" value="${existing ? existing.costPrice : ''}" min="0" required>
                </div>
                <div class="form-group">
                  <label class="form-label">ราคาขาย / คิดลูกค้า (บาท) <span class="required">*</span></label>
                  <input type="number" class="form-control" name="sellPrice" value="${existing ? existing.sellPrice : ''}" min="0" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">จำนวนในสต็อกปัจจุบัน <span class="required">*</span></label>
                  <input type="number" class="form-control" name="stock" value="${existing ? existing.stock : '5'}" min="0" required>
                </div>
                <div class="form-group">
                  <label class="form-label">เตือนเมื่อสต็อกต่ำกว่า (Min Stock)</label>
                  <input type="number" class="form-control" name="minStock" value="${existing ? existing.minStock : '2'}" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">หน่วยเรียก</label>
                  <input type="text" class="form-control" name="unit" value="${existing ? existing.unit || 'ชิ้น' : 'ชิ้น'}" placeholder="ชิ้น, ชุด, ก้อน">
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-modal">ยกเลิก</button>
              <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> บันทึกข้อมูลอะไหล่</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const modal = modalContainer.querySelector('#part-modal');
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => { modalContainer.innerHTML = ''; }, 300);
    };

    modal.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-modal').addEventListener('click', closeModal);

    modal.querySelector('#form-part').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const partObj = {
        id: existing ? existing.id : null,
        name: formData.get('name'),
        category: formData.get('category'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        costPrice: parseFloat(formData.get('costPrice')) || 0,
        sellPrice: parseFloat(formData.get('sellPrice')) || 0,
        stock: parseInt(formData.get('stock'), 10) || 0,
        minStock: parseInt(formData.get('minStock'), 10) || 0,
        unit: formData.get('unit') || 'ชิ้น'
      };

      store.savePart(partObj);
      showToast(existing ? 'บันทึกการแก้ไขเรียบร้อย' : 'เพิ่มอะไหล่ใหม่เรียบร้อย', 'success');
      closeModal();
      refreshInventoryTable();
    });
  }
}
