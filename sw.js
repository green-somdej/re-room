/* Service worker: เก็บหน้าแอป (เปลือก) ไว้ในเครื่อง ให้เปิดจากไอคอนได้เร็วและเปิดได้แม้สัญญาณไม่ดี
   ข้อมูลจริงอยู่ใน Google Apps Script/Sheets เสมอ — ไม่ถูกเก็บในแคชนี้
   แก้ index.html แล้วอยากให้ทุกเครื่องล้างแคชเก่า ให้เปลี่ยนเลขใน VERSION */
const PREFIX = 're-room-';
const VERSION = PREFIX + 'v1.0.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './trophy.jpg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // ลบเฉพาะแคชเก่าของ re-room (เว็บอื่นใน green-somdej.github.io เช่น green-env ใช้ที่เก็บแคชร่วมกัน)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // ไม่ยุ่งกับ Google Apps Script / ฟอนต์
  if (req.mode === 'navigate') {
    // หน้าเว็บ: เอาจากเน็ตก่อน (ได้เวอร์ชันล่าสุด) ถ้าออฟไลน์ใช้ที่เก็บไว้
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.open(VERSION).then(x => x.match('./index.html'))));
    return;
  }
  // ไฟล์อื่นในเว็บนี้: ใช้ที่เก็บไว้ก่อน แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.open(VERSION).then(x => x.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) x.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
