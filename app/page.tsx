import { Screen } from "@/components/ui/Screen";
import { COPY } from "@/lib/copy";
import StartPanel from "./StartPanel";

// หน้าแรก: บอกชัดว่าเป็นการจำลอง + ขอความยินยอม (CLAUDE.md ข้อ 7.3, 7.5)
// Week 2: โครงเรียบ — ดีไซน์จริงทำทีหลัง
export default function Home() {
  return (
    <Screen className="justify-center gap-6">
      <header>
        <h1 className="text-3xl font-bold">{COPY.appName}</h1>
        <p className="text-muted">{COPY.tagline}</p>
      </header>
      <StartPanel />
    </Screen>
  );
}
