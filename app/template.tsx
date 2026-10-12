// transition ระหว่างหน้า (Phase 4C): จางเข้าเบาๆ ทุกครั้งที่เปลี่ยนหน้า (template mount ใหม่ทุกการนำทาง)
// ใช้ CSS animation (ไม่ต้องรอ JS — HTML จาก server ไม่ค้างโปร่งใส) และแค่ opacity:
// transform บน wrapper จะทำให้ position: fixed ของลูก (ปุ่มข้าม, confetti, popup) เพี้ยน
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-page-in">{children}</div>;
}
