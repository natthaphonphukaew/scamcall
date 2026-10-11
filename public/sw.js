// Service worker ขั้นต่ำของ ScamCall
// - ไม่ cache หน้า/ข้อมูลใดๆ (แอปต้องต่อเน็ตเพื่อคุยกับ AI อยู่แล้ว และกันปัญหาเห็นเวอร์ชันเก่าตอนเดโม)
// - ถ้าเปิดหน้าแบบออฟไลน์ แสดงหน้าบอกให้ต่อเน็ต แทนหน้า error ของ browser

const OFFLINE_HTML = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ScamCall — ออฟไลน์</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;text-align:center;
background:#0b0f14;color:#f3f5f7;font-family:system-ui,sans-serif">
<div><h1 style="font-size:1.5rem">ตอนนี้ออฟไลน์อยู่</h1>
<p style="color:#8a96a3">ScamCall ต้องต่ออินเทอร์เน็ตเพื่อคุยกับ AI — ต่อเน็ตแล้วลองเปิดใหม่อีกครั้ง</p></div>
</body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // อย่างอื่นปล่อยผ่าน browser ตามปกติ
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    ),
  );
});
