/* ==========================================================================
   FixMaster Pro - Initial Mock Data (Realistic Thai Phone Repair Context)
   ========================================================================== */

export const INITIAL_SHOP_INFO = {
  name: "FixMaster Mobile & Tablet Service",
  branch: "สาขาใหญ่ สุขุมวิท 71",
  address: "458/12 ถนนสุขุมวิท 71 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110",
  phone: "089-123-4567, 02-765-4321",
  lineId: "@fixmaster_service",
  promptpay: "0891234567",
  promptpayName: "บจก. ฟิกซ์มาสเตอร์ โมบาย เซอร์วิส",
  vatNumber: "0105565012345",
  taxRate: 7 // percent
};

export const INITIAL_TECHNICIANS = [
  { id: "TECH-01", name: "ช่างเอก (Master IC & Screen)", phone: "081-111-2222" },
  { id: "TECH-02", name: "ช่างนพ (iOS / Android Specialist)", phone: "081-333-4444" },
  { id: "TECH-03", name: "ช่างบอล (Hardware & Battery Expert)", phone: "081-555-6666" }
];

export const INITIAL_INVENTORY = [
  {
    id: "PART-101",
    name: "หน้าจอ OLED iPhone 15 Pro Max (Grade Original)",
    category: "Display",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    costPrice: 4200,
    sellPrice: 6500,
    stock: 4,
    minStock: 2,
    unit: "ชุด"
  },
  {
    id: "PART-102",
    name: "แบตเตอรี่ iPhone 13 Pro (ความจุสูง 3095mAh + มอก.)",
    category: "Battery",
    brand: "Apple",
    model: "iPhone 13 Pro",
    costPrice: 750,
    sellPrice: 1650,
    stock: 8,
    minStock: 3,
    unit: "ก้อน"
  },
  {
    id: "PART-103",
    name: "หน้าจอ AMOLED Samsung Galaxy S23 Ultra (พร้อมกรอบ)",
    category: "Display",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    costPrice: 5800,
    sellPrice: 7900,
    stock: 2,
    minStock: 2,
    unit: "ชุด"
  },
  {
    id: "PART-104",
    name: "ชุดชาร์จ Flex Port USB-C iPad Pro 11 (M2)",
    category: "Charging Port",
    brand: "Apple",
    model: "iPad Pro 11 inch",
    costPrice: 450,
    sellPrice: 1200,
    stock: 1,
    minStock: 2,
    unit: "ชิ้น"
  },
  {
    id: "PART-105",
    name: "แบตเตอรี่ Xiaomi 13T Pro (5000mAh)",
    category: "Battery",
    brand: "Xiaomi",
    model: "Xiaomi 13T Pro",
    costPrice: 600,
    sellPrice: 1400,
    stock: 5,
    minStock: 2,
    unit: "ก้อน"
  },
  {
    id: "PART-106",
    name: "กระจกกล้องหลัง iPhone 14 Pro (พร้อมกาวซ่อม)",
    category: "Camera/Lens",
    brand: "Apple",
    model: "iPhone 14 Pro",
    costPrice: 120,
    sellPrice: 650,
    stock: 12,
    minStock: 5,
    unit: "ชิ้น"
  }
];

export const INITIAL_TICKETS = [
  {
    ticketId: "FIX-2026-001",
    createdAt: "2026-09-28T10:15:00",
    customer: {
      name: "คุณสมชาย ใจดี",
      phone: "086-999-8877",
      lineId: "somchai_live"
    },
    device: {
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      color: "Titanium Natural",
      serialImei: "359872109843210",
      passcode: "258012"
    },
    symptom: "ตกพื้นกระจกหน้าจอแตกยับ สัมผัสรวนเป็นบางจุด จอแสดงผลติดปกติ",
    preChecklist: {
      power: true,
      screenTouch: false,
      wifi: true,
      cameraFront: true,
      cameraBack: true,
      charging: true,
      faceId: true,
      speaker: true,
      microphone: true,
      buttons: true
    },
    assignedTechId: "TECH-01",
    status: "repairing", // pending, diagnosing, waiting_parts, repairing, ready, completed, cancelled
    partsUsed: [
      {
        partId: "PART-101",
        name: "หน้าจอ OLED iPhone 15 Pro Max (Grade Original)",
        quantity: 1,
        price: 6500
      }
    ],
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
    customer: {
      name: "คุณวิภาวรรณ สุขเสริฐ",
      phone: "092-444-5555",
      lineId: "vipa_w"
    },
    device: {
      brand: "Apple",
      model: "iPhone 13 Pro",
      color: "Sierra Blue",
      serialImei: "354128091823741",
      passcode: "112233"
    },
    symptom: "แบตเตอรี่เสื่อมไวลดยอด 100% ถึง 20% ใน 2 ชม. เครื่องร้อนง่าย",
    preChecklist: {
      power: true,
      screenTouch: true,
      wifi: true,
      cameraFront: true,
      cameraBack: true,
      charging: true,
      faceId: true,
      speaker: true,
      microphone: true,
      buttons: true
    },
    assignedTechId: "TECH-03",
    status: "ready",
    partsUsed: [
      {
        partId: "PART-102",
        name: "แบตเตอรี่ iPhone 13 Pro (ความจุสูง 3095mAh + มอก.)",
        quantity: 1,
        price: 1650
      }
    ],
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
    customer: {
      name: "คุณกิตติศักดิ์ พรหมรักษา",
      phone: "081-777-1234",
      lineId: ""
    },
    device: {
      brand: "Samsung",
      model: "Galaxy S23 Ultra",
      color: "Phantom Black",
      serialImei: "351092837465102",
      passcode: "รูปวาดตัว Z"
    },
    symptom: "ตูดชาร์จหลวม ชาร์จไฟเข้าบ้างไม่เข้าบ้าง ต้องเอียงสายชาร์จ",
    preChecklist: {
      power: true,
      screenTouch: true,
      wifi: true,
      cameraFront: true,
      cameraBack: true,
      charging: false,
      faceId: true,
      speaker: true,
      microphone: true,
      buttons: true
    },
    assignedTechId: "TECH-02",
    status: "pending",
    partsUsed: [],
    laborFee: 500,
    discount: 0,
    totalPrice: 1200,
    deposit: 0,
    logs: [
      { time: "2026-09-28T09:00:00", status: "pending", note: "เปิดใบรับซ่อม รอช่างเสนอราคาอะไหล่" }
    ],
    technicianNote: "รอแกะเช็คคราบความชื้นในพอร์ตชาร์จ"
  }
];
