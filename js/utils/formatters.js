/* ==========================================================================
   FixMaster Pro - Utility & Formatting Helper Functions
   ========================================================================== */

/**
 * Format numbers to Thai Baht currency (e.g. ฿1,500.00 or ฿1,500)
 */
export function formatCurrency(amount, showDecimals = false) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(num);
}

/**
 * Format ISO Date string to localized Thai date time format
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format short date (e.g., 28 ก.ย. 2026)
 */
export function formatDateShort(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get Status Label and Badge HTML Class
 */
export function getStatusMeta(status) {
  switch (status) {
    case 'pending':
      return { label: 'รับเรื่องแล้ว', labelEn: 'Pending', badgeClass: 'badge-pending', icon: 'fa-clock' };
    case 'diagnosing':
      return { label: 'กำลังตรวจเช็ค', labelEn: 'Diagnosing', badgeClass: 'badge-waiting', icon: 'fa-stethoscope' };
    case 'waiting_parts':
      return { label: 'รออะไหล่', labelEn: 'Waiting Parts', badgeClass: 'badge-waiting', icon: 'fa-box-open' };
    case 'repairing':
      return { label: 'กำลังซ่อม', labelEn: 'Repairing', badgeClass: 'badge-repairing', icon: 'fa-wrench' };
    case 'ready':
      return { label: 'ซ่อมเสร็จพร้อมส่ง', labelEn: 'Ready for Pickup', badgeClass: 'badge-ready', icon: 'fa-check-circle' };
    case 'completed':
      return { label: 'ส่งมอบ/ชำระเงินแล้ว', labelEn: 'Completed', badgeClass: 'badge-completed', icon: 'fa-box' };
    case 'cancelled':
      return { label: 'ยกเลิกการซ่อม', labelEn: 'Cancelled', badgeClass: 'badge-cancelled', icon: 'fa-times-circle' };
    default:
      return { label: status, labelEn: status, badgeClass: 'badge-secondary', icon: 'fa-info-circle' };
  }
}

/**
 * Generate Next Ticket ID (e.g., FIX-2026-004)
 */
export function generateTicketId(existingTickets) {
  const currentYear = new Date().getFullYear();
  const prefix = `FIX-${currentYear}-`;
  
  const numbers = existingTickets
    .map(t => t.ticketId)
    .filter(id => id && id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  
  return `${prefix}${nextNum}`;
}

/**
 * Toast Notification Helper
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'fa-check-circle';
  if (type === 'danger') iconName = 'fa-exclamation-circle';
  if (type === 'warning') iconName = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
