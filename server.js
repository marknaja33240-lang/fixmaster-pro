// ==========================================================================
// FixMaster Pro - Universal Node.js Backend Server
// Compatible with all Node.js versions (v18, v20, v22+)
// Uses built-in SQLite when available, with automatic JSON file fallback
// ==========================================================================

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'fixmaster.db');
const JSON_FILE = path.join(__dirname, 'fixmaster_data.json');

// --- 1. Detect SQLite Support ---
let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  DatabaseSync = null;
}

// Initial Data
const SEED_DATA = {
  shop: {
    id: 1,
    name: "FixMaster Mobile & Tablet Service",
    branch: "สาขาใหญ่ สุขุมวิท 71",
    address: "458/12 ถนนสุขุมวิท 71 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110",
    phone: "089-123-4567, 02-765-4321",
    lineId: "@fixmaster_service",
    promptpay: "0891234567",
    promptpayName: "บจก. ฟิกซ์มาสเตอร์ โมบาย เซอร์วิส",
    vatNumber: "0105565012345",
    taxRate: 7
  },
  technicians: [
    { id: "TECH-01", name: "ช่างเอก (Master IC & Screen)", phone: "081-111-2222" },
    { id: "TECH-02", name: "ช่างนพ (iOS / Android Specialist)", phone: "081-333-4444" },
    { id: "TECH-03", name: "ช่างบอล (Hardware & Battery Expert)", phone: "081-555-6666" }
  ],
  inventory: [
    { id: "PART-101", name: "หน้าจอ OLED iPhone 15 Pro Max (Grade Original)", category: "Display", brand: "Apple", model: "iPhone 15 Pro Max", costPrice: 4200, sellPrice: 6500, stock: 4, minStock: 2, unit: "ชุด" },
    { id: "PART-102", name: "แบตเตอรี่ iPhone 13 Pro (ความจุสูง 3095mAh + มอก.)", category: "Battery", brand: "Apple", model: "iPhone 13 Pro", costPrice: 750, sellPrice: 1650, stock: 8, minStock: 3, unit: "ก้อน" },
    { id: "PART-103", name: "หน้าจอ AMOLED Samsung Galaxy S23 Ultra (พร้อมกรอบ)", category: "Display", brand: "Samsung", model: "Galaxy S23 Ultra", costPrice: 5800, sellPrice: 7900, stock: 2, minStock: 2, unit: "ชุด" },
    { id: "PART-104", name: "ชุดชาร์จ Flex Port USB-C iPad Pro 11 (M2)", category: "Charging Port", brand: "Apple", model: "iPad Pro 11 inch", costPrice: 450, sellPrice: 1200, stock: 1, minStock: 2, unit: "ชิ้น" },
    { id: "PART-105", name: "แบตเตอรี่ Xiaomi 13T Pro (5000mAh)", category: "Battery", brand: "Xiaomi", model: "Xiaomi 13T Pro", costPrice: 600, sellPrice: 1400, stock: 5, minStock: 2, unit: "ก้อน" },
    { id: "PART-106", name: "กระจกกล้องหลัง iPhone 14 Pro (พร้อมกาวซ่อม)", category: "Camera/Lens", brand: "Apple", model: "iPhone 14 Pro", costPrice: 120, sellPrice: 650, stock: 12, minStock: 5, unit: "ชิ้น" }
  ],
  tickets: [
    {
      ticketId: "FIX-2026-001",
      createdAt: "2026-09-28T10:15:00",
      customer: { name: "คุณสมชาย ใจดี", phone: "086-999-8877", lineId: "somchai_live" },
      device: { brand: "Apple", model: "iPhone 15 Pro Max", color: "Titanium Natural", serialImei: "359872109843210", passcode: "258012" },
      symptom: "ตกพื้นกระจกหน้าจอแตกยับ สัมผัสรวนเป็นบางจุด จอแสดงผลติดปกติ",
      preChecklist: { power: true, screenTouch: false, wifi: true, cameraFront: true, cameraBack: true, charging: true, faceId: true, speaker: true, microphone: true, buttons: true },
      assignedTechId: "TECH-01",
      status: "repairing",
      partsUsed: [{ partId: "PART-101", name: "หน้าจอ OLED iPhone 15 Pro Max (Grade Original)", quantity: 1, price: 6500 }],
      laborFee: 800,
      discount: 300,
      totalPrice: 7000,
      deposit: 2000,
      logs: [
        { time: "2026-09-28T10:15:00", status: "pending", note: "เปิดใบรับซ่อม มัดจำ 2,000 บาท" },
        { time: "2026-09-28T11:00:00", status: "diagnosing", note: "ช่างเอกตรวจเช็คบอร์ด ไม่พบไฟฟ้าลัดวงจร" },
        { time: "2026-09-28T13:30:00", status: "repairing", note: "เบิกจอ OLED แท้ และกำลังประกอบ" }
      ],
      technicianNote: "รอยซ่อมเดิมไม่เคยผ่านการแกะ บอร์ดสวยงาม สแกนหน้าผ่านปกติ"
    },
    {
      ticketId: "FIX-2026-002",
      createdAt: "2026-09-27T14:20:00",
      customer: { name: "คุณวิภาวรรณ สุขเสริฐ", phone: "092-444-5555", lineId: "vipa_w" },
      device: { brand: "Apple", model: "iPhone 13 Pro", color: "Sierra Blue", serialImei: "354128091823741", passcode: "112233" },
      symptom: "แบตเตอรี่เสื่อมไวลดยอด 100% ถึง 20% ใน 2 ชม. เครื่องร้อนง่าย",
      preChecklist: { power: true, screenTouch: true, wifi: true, cameraFront: true, cameraBack: true, charging: true, faceId: true, speaker: true, microphone: true, buttons: true },
      assignedTechId: "TECH-03",
      status: "ready",
      partsUsed: [{ partId: "PART-102", name: "แบตเตอรี่ iPhone 13 Pro (ความจุสูง 3095mAh + มอก.)", quantity: 1, price: 1650 }],
      laborFee: 450,
      discount: 100,
      totalPrice: 2000,
      deposit: 0,
      logs: [
        { time: "2026-09-27T14:20:00", status: "pending", note: "เปิดใบรับซ่อม" },
        { time: "2026-09-27T15:00:00", status: "repairing", note: "เปลี่ยนแบตเตอรี่ มอก. สุขภาพแบต 100%" },
        { time: "2026-09-27T16:30:00", status: "ready", note: "QC ผ่านเรียบร้อย รอลูกค้ารับเครื่อง" }
      ],
      technicianNote: "เทสอบชาร์จเข้าปกติ กระแสไฟ 2.1A สุขภาพแบตเตอรี่เต็ม 100%"
    },
    {
      ticketId: "FIX-2026-003",
      createdAt: "2026-09-28T09:00:00",
      customer: { name: "คุณกิตติศักดิ์ พรหมรักษา", phone: "081-777-1234", lineId: "" },
      device: { brand: "Samsung", model: "Galaxy S23 Ultra", color: "Phantom Black", serialImei: "351092837465102", passcode: "รูปวาดตัว Z" },
      symptom: "ตูดชาร์จหลวม ชาร์จไฟเข้าบ้างไม่เข้าบ้าง ต้องเอียงสายชาร์จ",
      preChecklist: { power: true, screenTouch: true, wifi: true, cameraFront: true, cameraBack: true, charging: false, faceId: true, speaker: true, microphone: true, buttons: true },
      assignedTechId: "TECH-02",
      status: "pending",
      partsUsed: [],
      laborFee: 500,
      discount: 0,
      totalPrice: 1200,
      deposit: 0,
      logs: [{ time: "2026-09-28T09:00:00", status: "pending", note: "เปิดใบรับซ่อม รอช่างเสนอราคาอะไหล่" }],
      technicianNote: "รอแกะเช็คคราบความชื้นในพอร์ตชาร์จ"
    }
  ]
};

// Data Store Abstraction
class StorageEngine {
  constructor() {
    this.isSqlite = !!DatabaseSync;
    if (this.isSqlite) {
      try {
        this.sqliteDb = new DatabaseSync(DB_FILE);
        this.initSqlite();
        console.log('✅ Storage: SQLite Database Engine active');
      } catch (err) {
        console.warn('SQLite init error, falling back to JSON:', err);
        this.isSqlite = false;
        this.initJson();
      }
    } else {
      console.log('ℹ️ Storage: JSON Persistence Engine active (Node < 22.5)');
      this.initJson();
    }
  }

  initSqlite() {
    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS shop_info (id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT, branch TEXT, address TEXT, phone TEXT, lineId TEXT, promptpay TEXT, promptpayName TEXT, vatNumber TEXT, taxRate REAL);
      CREATE TABLE IF NOT EXISTS technicians (id TEXT PRIMARY KEY, name TEXT, phone TEXT);
      CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, name TEXT, category TEXT, brand TEXT, model TEXT, costPrice REAL, sellPrice REAL, stock INTEGER, minStock INTEGER, unit TEXT);
      CREATE TABLE IF NOT EXISTS tickets (ticketId TEXT PRIMARY KEY, createdAt TEXT, customer_json TEXT, device_json TEXT, symptom TEXT, preChecklist_json TEXT, assignedTechId TEXT, status TEXT, partsUsed_json TEXT, laborFee REAL, discount REAL, totalPrice REAL, deposit REAL, logs_json TEXT, technicianNote TEXT);
    `);
    const count = this.sqliteDb.prepare('SELECT count(*) as count FROM shop_info').get().count;
    if (count === 0) {
      this.resetSqlite();
    }
  }

  resetSqlite() {
    const s = SEED_DATA;
    this.sqliteDb.exec('DELETE FROM shop_info; DELETE FROM technicians; DELETE FROM inventory; DELETE FROM tickets;');
    this.sqliteDb.prepare(`INSERT INTO shop_info VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      s.shop.name, s.shop.branch, s.shop.address, s.shop.phone, s.shop.lineId, s.shop.promptpay, s.shop.promptpayName, s.shop.vatNumber, s.shop.taxRate
    );
    const inTech = this.sqliteDb.prepare('INSERT INTO technicians VALUES (?, ?, ?)');
    s.technicians.forEach(t => inTech.run(t.id, t.name, t.phone));
    const inPart = this.sqliteDb.prepare('INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    s.inventory.forEach(p => inPart.run(p.id, p.name, p.category, p.brand, p.model, p.costPrice, p.sellPrice, p.stock, p.minStock, p.unit));
    const inTicket = this.sqliteDb.prepare('INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    s.tickets.forEach(t => inTicket.run(
      t.ticketId, t.createdAt, JSON.stringify(t.customer), JSON.stringify(t.device), t.symptom,
      JSON.stringify(t.preChecklist), t.assignedTechId, t.status, JSON.stringify(t.partsUsed),
      t.laborFee, t.discount, t.totalPrice, t.deposit, JSON.stringify(t.logs), t.technicianNote
    ));
  }

  initJson() {
    if (!fs.existsSync(JSON_FILE)) {
      fs.writeFileSync(JSON_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf8');
    }
  }

  readJson() {
    try {
      const data = fs.readFileSync(JSON_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return SEED_DATA;
    }
  }

  writeJson(data) {
    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  // --- API Methods ---
  getShop() {
    if (this.isSqlite) {
      return this.sqliteDb.prepare('SELECT * FROM shop_info WHERE id = 1').get() || SEED_DATA.shop;
    }
    return this.readJson().shop || SEED_DATA.shop;
  }

  saveShop(b) {
    if (this.isSqlite) {
      this.sqliteDb.prepare(`UPDATE shop_info SET name=?, branch=?, address=?, phone=?, lineId=?, promptpay=?, promptpayName=?, vatNumber=?, taxRate=? WHERE id = 1`)
        .run(b.name, b.branch, b.address, b.phone, b.lineId, b.promptpay, b.promptpayName, b.vatNumber, b.taxRate);
    } else {
      const data = this.readJson();
      data.shop = { ...data.shop, ...b };
      this.writeJson(data);
    }
  }

  getTechs() {
    if (this.isSqlite) return this.sqliteDb.prepare('SELECT * FROM technicians').all();
    return this.readJson().technicians || [];
  }

  getInventory() {
    if (this.isSqlite) return this.sqliteDb.prepare('SELECT * FROM inventory').all();
    return this.readJson().inventory || [];
  }

  savePart(p) {
    const id = p.id || `PART-${Date.now().toString().slice(-4)}`;
    p.id = id;
    if (this.isSqlite) {
      const exist = this.sqliteDb.prepare('SELECT id FROM inventory WHERE id = ?').get(id);
      if (exist) {
        this.sqliteDb.prepare('UPDATE inventory SET name=?, category=?, brand=?, model=?, costPrice=?, sellPrice=?, stock=?, minStock=?, unit=? WHERE id=?')
          .run(p.name, p.category, p.brand, p.model, p.costPrice, p.sellPrice, p.stock, p.minStock, p.unit || 'ชิ้น', id);
      } else {
        this.sqliteDb.prepare('INSERT INTO inventory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(id, p.name, p.category, p.brand, p.model, p.costPrice, p.sellPrice, p.stock, p.minStock, p.unit || 'ชิ้น');
      }
    } else {
      const data = this.readJson();
      const idx = data.inventory.findIndex(x => x.id === id);
      if (idx >= 0) data.inventory[idx] = { ...data.inventory[idx], ...p };
      else data.inventory.push(p);
      this.writeJson(data);
    }
    return p;
  }

  deletePart(id) {
    if (this.isSqlite) this.sqliteDb.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    else {
      const data = this.readJson();
      data.inventory = data.inventory.filter(x => x.id !== id);
      this.writeJson(data);
    }
  }

  getTickets() {
    if (this.isSqlite) {
      const rows = this.sqliteDb.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
      return rows.map(r => ({
        ticketId: r.ticketId,
        createdAt: r.createdAt,
        customer: JSON.parse(r.customer_json || '{}'),
        device: JSON.parse(r.device_json || '{}'),
        symptom: r.symptom,
        preChecklist: JSON.parse(r.preChecklist_json || '{}'),
        assignedTechId: r.assignedTechId,
        status: r.status,
        partsUsed: JSON.parse(r.partsUsed_json || '[]'),
        laborFee: r.laborFee,
        discount: r.discount,
        totalPrice: r.totalPrice,
        deposit: r.deposit,
        logs: JSON.parse(r.logs_json || '[]'),
        technicianNote: r.technicianNote || ''
      }));
    }
    return this.readJson().tickets || [];
  }

  getTicket(id) {
    return this.getTickets().find(t => t.ticketId.toLowerCase() === id.toLowerCase());
  }

  saveTicket(t) {
    if (this.isSqlite) {
      const exist = this.sqliteDb.prepare('SELECT ticketId FROM tickets WHERE ticketId = ?').get(t.ticketId);
      if (exist) {
        this.sqliteDb.prepare(`UPDATE tickets SET customer_json=?, device_json=?, symptom=?, preChecklist_json=?, assignedTechId=?, status=?, partsUsed_json=?, laborFee=?, discount=?, totalPrice=?, deposit=?, logs_json=?, technicianNote=? WHERE ticketId=?`)
          .run(JSON.stringify(t.customer||{}), JSON.stringify(t.device||{}), t.symptom||'', JSON.stringify(t.preChecklist||{}), t.assignedTechId||'', t.status||'pending', JSON.stringify(t.partsUsed||[]), t.laborFee||0, t.discount||0, t.totalPrice||0, t.deposit||0, JSON.stringify(t.logs||[]), t.technicianNote||'', t.ticketId);
      } else {
        this.sqliteDb.prepare(`INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(t.ticketId, t.createdAt||new Date().toISOString(), JSON.stringify(t.customer||{}), JSON.stringify(t.device||{}), t.symptom||'', JSON.stringify(t.preChecklist||{}), t.assignedTechId||'', t.status||'pending', JSON.stringify(t.partsUsed||[]), t.laborFee||0, t.discount||0, t.totalPrice||0, t.deposit||0, JSON.stringify(t.logs||[]), t.technicianNote||'');
      }
    } else {
      const data = this.readJson();
      const idx = data.tickets.findIndex(x => x.ticketId === t.ticketId);
      if (idx >= 0) data.tickets[idx] = { ...data.tickets[idx], ...t };
      else data.tickets.unshift(t);
      this.writeJson(data);
    }
    return t;
  }

  updateTicketStatus(ticketId, status, note) {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return null;
    ticket.status = status;
    if (!ticket.logs) ticket.logs = [];
    ticket.logs.push({ time: new Date().toISOString(), status, note: note || `เปลี่ยนสถานะเป็น ${status}` });
    this.saveTicket(ticket);
    return ticket;
  }

  deleteTicket(ticketId) {
    if (this.isSqlite) this.sqliteDb.prepare('DELETE FROM tickets WHERE ticketId = ?').run(ticketId);
    else {
      const data = this.readJson();
      data.tickets = data.tickets.filter(x => x.ticketId !== ticketId);
      this.writeJson(data);
    }
  }

  resetAll() {
    if (this.isSqlite) this.resetSqlite();
    else this.writeJson(SEED_DATA);
  }
}

const store = new StorageEngine();

// --- 2. HTTP Server & Router ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/shop') {
        if (method === 'GET') return sendJson(res, 200, store.getShop());
        if (method === 'PUT') {
          const b = await readJsonBody(req);
          store.saveShop(b);
          return sendJson(res, 200, { success: true });
        }
      }

      if (pathname === '/api/technicians' && method === 'GET') {
        return sendJson(res, 200, store.getTechs());
      }

      if (pathname === '/api/inventory') {
        if (method === 'GET') return sendJson(res, 200, store.getInventory());
        if (method === 'POST') {
          const p = await readJsonBody(req);
          return sendJson(res, 201, store.savePart(p));
        }
      }

      const invMatch = pathname.match(/^\/api\/inventory\/([^/]+)$/);
      if (invMatch) {
        const partId = decodeURIComponent(invMatch[1]);
        if (method === 'PUT') {
          const p = await readJsonBody(req);
          p.id = partId;
          return sendJson(res, 200, store.savePart(p));
        }
        if (method === 'DELETE') {
          store.deletePart(partId);
          return sendJson(res, 200, { success: true });
        }
      }

      if (pathname === '/api/tickets') {
        if (method === 'GET') return sendJson(res, 200, store.getTickets());
        if (method === 'POST') {
          const t = await readJsonBody(req);
          return sendJson(res, 201, store.saveTicket(t));
        }
      }

      const ticketMatch = pathname.match(/^\/api\/tickets\/([^/]+)$/);
      if (ticketMatch) {
        const ticketId = decodeURIComponent(ticketMatch[1]);
        if (method === 'GET') {
          const t = store.getTicket(ticketId);
          if (!t) return sendJson(res, 404, { error: 'Not found' });
          return sendJson(res, 200, t);
        }
        if (method === 'PUT') {
          const t = await readJsonBody(req);
          t.ticketId = ticketId;
          return sendJson(res, 200, store.saveTicket(t));
        }
        if (method === 'DELETE') {
          store.deleteTicket(ticketId);
          return sendJson(res, 200, { success: true });
        }
      }

      const statusMatch = pathname.match(/^\/api\/tickets\/([^/]+)\/status$/);
      if (statusMatch && method === 'POST') {
        const ticketId = decodeURIComponent(statusMatch[1]);
        const { status, note } = await readJsonBody(req);
        const t = store.updateTicketStatus(ticketId, status, note);
        if (!t) return sendJson(res, 404, { error: 'Not found' });
        return sendJson(res, 200, t);
      }

      if (pathname === '/api/reset' && method === 'POST') {
        store.resetAll();
        return sendJson(res, 200, { success: true });
      }

      return sendJson(res, 404, { error: 'Endpoint not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Static Files
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, reqPath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
=============================================================
🚀 FixMaster Pro is running!
📡 URL: http://0.0.0.0:${PORT}
💾 Mode: ${store.isSqlite ? 'SQLite Database' : 'JSON Persistence'}
=============================================================
  `);
});
