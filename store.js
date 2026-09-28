/* ==========================================================================
   FixMaster Pro - Centralized Store (SQLite REST API + LocalStorage Cache)
   ========================================================================== */

import { INITIAL_SHOP_INFO, INITIAL_TECHNICIANS, INITIAL_INVENTORY, INITIAL_TICKETS } from './mockData.js';

const STORAGE_KEYS = {
  SHOP_INFO: 'fixmaster_shop_info',
  TECHNICIANS: 'fixmaster_technicians',
  INVENTORY: 'fixmaster_inventory',
  TICKETS: 'fixmaster_tickets'
};

class Store {
  constructor() {
    this.listeners = [];
    this.isServerConnected = false;
    this.init();
  }

  async init() {
    // 1. Initial load from LocalStorage cache for instant UI rendering
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.SHOP_INFO, JSON.stringify(INITIAL_SHOP_INFO));
      localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(INITIAL_TECHNICIANS));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
    }

    // 2. Try fetching latest data from Node.js SQLite Database via REST API
    try {
      await this.syncFromBackend();
      this.isServerConnected = true;
      this.notify();
      this.renderDbIndicator(true);
    } catch (err) {
      console.warn('Backend API offline, running in LocalStorage mode:', err);
      this.isServerConnected = false;
      this.renderDbIndicator(false);
    }
  }

  async syncFromBackend() {
    const [shopRes, techRes, invRes, ticketsRes] = await Promise.all([
      fetch('/api/shop'),
      fetch('/api/technicians'),
      fetch('/api/inventory'),
      fetch('/api/tickets')
    ]);

    if (shopRes.ok && techRes.ok && invRes.ok && ticketsRes.ok) {
      const shop = await shopRes.json();
      const techs = await techRes.json();
      const inv = await invRes.json();
      const tickets = await ticketsRes.json();

      localStorage.setItem(STORAGE_KEYS.SHOP_INFO, JSON.stringify(shop));
      localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    }
  }

  renderDbIndicator(isConnected) {
    let badge = document.getElementById('db-status-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'db-status-badge';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '6px';
      badge.style.fontSize = '0.78rem';
      badge.style.fontWeight = '600';
      badge.style.padding = '4px 10px';
      badge.style.borderRadius = '999px';
      badge.style.marginLeft = '10px';

      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        navActions.insertBefore(badge, navActions.firstChild);
      }
    }

    if (isConnected) {
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.color = '#34d399';
      badge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      badge.innerHTML = '<i class="fas fa-database"></i> SQLite Connected';
      badge.title = 'เชื่อมต่อฐานข้อมูล SQLite (fixmaster.db) สำเร็จ';
    } else {
      badge.style.background = 'rgba(245, 158, 11, 0.15)';
      badge.style.color = '#fbbf24';
      badge.style.border = '1px solid rgba(245, 158, 11, 0.3)';
      badge.innerHTML = '<i class="fas fa-hdd"></i> Local Storage';
      badge.title = 'ใช้งานโหมดออฟไลน์ / LocalStorage';
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // --- SHOP INFO ---
  getShopInfo() {
    const data = localStorage.getItem(STORAGE_KEYS.SHOP_INFO);
    return data ? JSON.parse(data) : INITIAL_SHOP_INFO;
  }

  async saveShopInfo(info) {
    localStorage.setItem(STORAGE_KEYS.SHOP_INFO, JSON.stringify(info));
    this.notify();

    try {
      await fetch('/api/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });
    } catch (e) {
      console.warn('API sync failed:', e);
    }
  }

  // --- TECHNICIANS ---
  getTechnicians() {
    const data = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    return data ? JSON.parse(data) : INITIAL_TECHNICIANS;
  }

  // --- INVENTORY ---
  getInventory() {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  }

  getPartById(id) {
    return this.getInventory().find(p => p.id === id);
  }

  async savePart(partData) {
    const inventory = this.getInventory();
    const isNew = !partData.id;
    if (isNew) {
      partData.id = `PART-${Date.now().toString().slice(-4)}`;
      inventory.push(partData);
    } else {
      const index = inventory.findIndex(p => p.id === partData.id);
      if (index >= 0) inventory[index] = { ...inventory[index], ...partData };
    }

    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    this.notify();

    try {
      if (isNew) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partData)
        });
      } else {
        await fetch(`/api/inventory/${encodeURIComponent(partData.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partData)
        });
      }
    } catch (e) {
      console.warn('API sync failed:', e);
    }

    return partData;
  }

  async deletePart(id) {
    let inventory = this.getInventory();
    inventory = inventory.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    this.notify();

    try {
      await fetch(`/api/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API sync failed:', e);
    }
  }

  async updateStock(partId, quantityUsed) {
    const inventory = this.getInventory();
    const part = inventory.find(p => p.id === partId);
    if (part) {
      part.stock = Math.max(0, part.stock - quantityUsed);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      this.notify();

      try {
        await fetch(`/api/inventory/${encodeURIComponent(partId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(part)
        });
      } catch (e) {
        console.warn('API sync failed:', e);
      }
    }
  }

  // --- TICKETS ---
  getTickets() {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  getTicketById(ticketId) {
    return this.getTickets().find(t => t.ticketId.toLowerCase() === ticketId.toLowerCase());
  }

  async saveTicket(ticketData) {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.ticketId === ticketData.ticketId);
    const isNew = index < 0;

    if (isNew) {
      tickets.unshift(ticketData);
    } else {
      tickets[index] = { ...tickets[index], ...ticketData };
    }

    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notify();

    try {
      if (isNew) {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketData)
        });
      } else {
        await fetch(`/api/tickets/${encodeURIComponent(ticketData.ticketId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketData)
        });
      }
    } catch (e) {
      console.warn('API sync failed:', e);
    }

    return ticketData;
  }

  async updateTicketStatus(ticketId, newStatus, note = '') {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (ticket) {
      ticket.status = newStatus;
      if (!ticket.logs) ticket.logs = [];
      ticket.logs.push({
        time: new Date().toISOString(),
        status: newStatus,
        note: note || `เปลี่ยนสถานะเป็น ${newStatus}`
      });
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      this.notify();

      try {
        await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, note: note || '' })
        });
      } catch (e) {
        console.warn('API sync failed:', e);
      }
    }
  }

  async deleteTicket(ticketId) {
    let tickets = this.getTickets();
    tickets = tickets.filter(t => t.ticketId !== ticketId);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notify();

    try {
      await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API sync failed:', e);
    }
  }

  async resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.SHOP_INFO, JSON.stringify(INITIAL_SHOP_INFO));
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(INITIAL_TECHNICIANS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
    this.notify();

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('API sync failed:', e);
    }
  }
}

export const store = new Store();
