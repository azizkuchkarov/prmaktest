import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth-session";

export const runtime = "nodejs";

const MAX_BYTES = 2_500_000;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? "";
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form ma'lumotlari noto'g'ri." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fayl tanlang." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Rasm hajmi 2.5 MB dan katta bo'lmasin." }, { status: 400 });
  }

  const mime = file.type;
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json(
      { error: "Faqat JPEG, PNG, WebP yoki GIF yuklash mumkin." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "questions");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  const url = `/uploads/questions/${name}`;
  return NextResponse.json({ url });
}
