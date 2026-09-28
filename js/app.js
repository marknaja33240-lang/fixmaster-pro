/* ==========================================================================
   FixMaster Pro - Main Application Router & Event Controller
   ========================================================================== */

import { store } from './store.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTickets } from './components/tickets.js';
import { renderInventory } from './components/inventory.js';
import { renderPos } from './components/pos.js';
import { renderTracker } from './components/tracker.js';
import { initPrintReceiptModal } from './components/printModal.js';
import { showToast } from './utils/formatters.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.currentOptions = {};
    this.mainContainer = document.getElementById('main-container');
    this.navBtns = document.querySelectorAll('.nav-links .nav-btn');
    this.brandLogo = document.querySelector('.brand-logo');
    this.globalSearchInput = document.getElementById('global-search-input');
  }

  init() {
    // Initialize printable modal window helper
    initPrintReceiptModal();

    // Check query params if customer tracked link
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) {
      this.navigate('tracker', { query: trackParam });
    } else {
      this.navigate('dashboard');
    }

    // Attach Navigation listeners
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        if (view) this.navigate(view);
      });
    });

    if (this.brandLogo) {
      this.brandLogo.addEventListener('click', () => this.navigate('dashboard'));
    }

    // Global Search listener
    if (this.globalSearchInput) {
      this.globalSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query) {
            this.navigate('tickets', { searchQuery: query });
          }
        }
      });
    }

    // Reset Data button
    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นหรือไม่? (ข้อมูลที่แก้ไขจะถูกรีเซ็ต)')) {
        store.resetToDefault();
        showToast('รีเซ็ตข้อมูลระบบเป็นค่าเริ่มต้นเรียบร้อยแล้ว', 'success');
        this.renderCurrentView();
      }
    });

    // Subscribe to store updates
    store.subscribe(() => {
      // Re-render if necessary
    });
  }

  navigate(viewName, options = {}) {
    this.currentView = viewName;
    this.currentOptions = options;

    // Update Nav Active State
    this.navBtns.forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    if (!this.mainContainer) return;

    const routerCallback = (view, opts) => this.navigate(view, opts);

    switch (this.currentView) {
      case 'dashboard':
        renderDashboard(this.mainContainer, routerCallback);
        break;
      case 'tickets':
        renderTickets(this.mainContainer, routerCallback, this.currentOptions);
        break;
      case 'inventory':
        renderInventory(this.mainContainer, routerCallback);
        break;
      case 'pos':
        renderPos(this.mainContainer, routerCallback, this.currentOptions);
        break;
      case 'tracker':
        renderTracker(this.mainContainer, routerCallback, this.currentOptions);
        break;
      default:
        renderDashboard(this.mainContainer, routerCallback);
        break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
