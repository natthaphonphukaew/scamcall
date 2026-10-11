import type { Channel } from "@/lib/types";
import type { LandmarkKey, Pt } from "./data";

// NPC และแลนด์มาร์กบนแผนที่ (docs/GAME_SPEC.md ข้อ 3, 9) — ข้อมูลฝั่ง browser ได้ ไม่มีบท/พรอมต์
// เพิ่มด่านใหม่: เพิ่ม NPC ที่นี่ + ไฟล์ด่านใน scenarios/ ที่ id ตรงกับ levelId

export interface LandmarkInfo {
  ref: string;
  /** ชื่อที่นักศึกษาเรียก */
  label: string;
  full: string;
}

export const LANDMARK_INFO: Record<LandmarkKey, LandmarkInfo> = {
  lx: { ref: "N16", label: "ตึก LX", full: "อาคารการเรียนรู้พหุวิทยาการ (Learning Exchange)" },
  library: { ref: "N10", label: "หอสมุด", full: "อาคารสำนักหอสมุด" },
  sit: { ref: "N11", label: "ตึก SIT", full: "อาคารคณะเทคโนโลยีสารสนเทศ" },
  kfc: { ref: "S14", label: "KFC", full: "โรงอาหาร King Mongkut's Food Center · อาคารพระจอมเกล้าราชานุสรณ์ 190 ปี" },
  dorm_male: { ref: "S5", label: "หอชาย", full: "บ้านธรรมรักษา 2" },
  dorm_female: { ref: "S6", label: "หอหญิง", full: "บ้านธรรมรักษา 1" },
  red: { ref: "S4", label: "ตึกแดง", full: "อาคารวิศววัฒนะ" },
};

export interface Npc {
  id: string;
  name: string;
  /** ชั้นปี/บทบาท */
  role: string;
  landmark: LandmarkKey;
  /** ยืนฝั่งที่หันไปจุดนี้ (ค่าเริ่มต้น = กลางแคมปัส) — ใช้แยก NPC ที่ตึกติดกันไม่ให้ป้ายทับกัน */
  facing?: Pt;
  /** id ของด่านใน scenarios/ — ถ้ายังไม่มีไฟล์ด่าน = "เร็วๆ นี้" */
  levelId: string;
  channel: Channel;
  /** คำพูดบนป้ายเหนือหัว */
  hook: string;
  /** สถานการณ์ใน StoryCard */
  story: string;
  /** สีเสื้อ / ผม ของตัวละคร chibi */
  shirt: string;
  hair: string;
}

export const NPCS: Npc[] = [
  {
    id: "mint",
    name: "น้องมิ้นท์",
    role: "ปี 1",
    landmark: "dorm_female",
    // หอหญิงติดหอชาย — ยืนฝั่งใต้ของหอ ป้ายจะได้ไม่ทับน้องเจ
    facing: [20, 600],
    levelId: "bank-account-hacked",
    channel: "call",
    hook: "ธนาคารโทรมาบอกบัญชีโดนแฮ็ก!",
    story:
      'มิ้นท์เพิ่งกลับถึงหอ มีสายจาก "ฝ่ายป้องกันทุจริตของธนาคาร" บอกว่ามีคนพยายามเข้าบัญชีจากต่างประเทศ เงินกำลังจะถูกตัด…',
    shirt: "#f472b6",
    hair: "#3f2a1e",
  },
  {
    id: "ton",
    name: "พี่ต้น",
    role: "ปี 3 วิศวะ",
    landmark: "red",
    levelId: "police-money-laundering",
    channel: "call",
    hook: "ตำรวจโทรมาว่าบัญชีพัวพันฟอกเงิน",
    story:
      'ระหว่างรอเข้าแล็บที่ตึกแดง พี่ต้นได้รับสายจาก "สภ.เมืองนนทบุรี" แจ้งว่าบัญชีในชื่อพี่ต้นถูกใช้ในคดีฟอกเงิน และมีหมายเรียกออกแล้ว',
    shirt: "#2563eb",
    hair: "#111827",
  },
  {
    id: "jay",
    name: "น้องเจ",
    role: "ปี 2",
    landmark: "dorm_male",
    // ฝั่งเหนือของหอชายติดตึกแดง — ยืนฝั่งตะวันออก กล้องจะได้ไม่โดนตึกแดงบัง
    facing: [400, 230],
    levelId: "parcel-illegal-goods",
    channel: "call",
    hook: "พัสดุชื่อเราโดนตีกลับ มียาเสพติด?!",
    story:
      'เจรอพัสดุที่หอ แต่กลับมีสายจาก "ศูนย์บริการขนส่ง" บอกว่าพัสดุชื่อเจถูกตีกลับที่ด่านศุลกากร ข้างในมีบัตรประชาชนปลอมและยาเสพติด',
    shirt: "#16a34a",
    hair: "#1f2937",
  },
  {
    id: "fah",
    name: "พี่ฟ้า",
    role: "ปี 4 ฝึกงาน",
    landmark: "library",
    // ฝั่งใต้ของหอสมุดมีตึก LX 15 ชั้นบังกล้อง · ฝั่งตะวันตกติด SIT (ประตู Hall) — ยืนมุมตะวันออกเฉียงเหนือ
    facing: [320, -230],
    levelId: "revenue-tax-refund",
    channel: "call",
    hook: "สรรพากรจะคืนภาษีให้ด้วย ดีจัง~",
    story:
      'พี่ฟ้านั่งทำโปรเจกต์จบที่หอสมุด เจ้าหน้าที่ "กรมสรรพากร" โทรมาอย่างใจดี บอกว่ามีเงินภาษีจากค่าฝึกงานได้คืน แค่ยืนยันตัวตนวันนี้',
    shirt: "#0ea5e9",
    hair: "#4b2e1f",
  },
  {
    id: "cheese",
    name: "น้องชีส",
    role: "ปี 2",
    landmark: "kfc",
    levelId: "investment-chat",
    channel: "chat",
    hook: "มีคนชวนลงทุน กำไร 30% ต่อเดือน!",
    story:
      'ชีสนั่งกินข้าวที่ KFC มีข้อความจาก "โค้ชลงทุน" ส่งรูปกำไรของรุ่นพี่มาให้ดู ชวนเข้ากลุ่ม VIP ลงทุนน้อยได้กำไรเยอะ',
    shirt: "#f59e0b",
    hair: "#78350f",
  },
  {
    id: "boss",
    name: "น้องบอส",
    role: "ปี 1",
    landmark: "lx",
    levelId: "online-job-chat",
    channel: "chat",
    hook: "มีงานกดไลก์ ได้วันละ 500!",
    story: "บอสนั่งรอเรียนที่ LX มีแชทชวนทำงานพาร์ตไทม์ออนไลน์ แค่กดไลก์ได้ครั้งละ 50 บาท ทำง่ายๆ ได้เงินจริง",
    shirt: "#8b5cf6",
    hair: "#0f172a",
  },
];

/** ตึก SIT = ประตูเข้า Hall of Bangmod (ไม่มี NPC) */
export const HALL_LANDMARK: LandmarkKey = "sit";
/** ให้ประตู Hall อยู่ฝั่งตะวันตกของ SIT — ฝั่งตะวันออกติดหอสมุด ป้ายจะทับกับพี่ฟ้า */
export const HALL_FACING: [number, number] = [-400, -60];
