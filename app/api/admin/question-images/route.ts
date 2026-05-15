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

const extToMime = new Map<string, string>([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
]);

function mimeFromFileName(fileName: string): string | null {
  const base = fileName.trim().toLowerCase();
  const dot = base.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = base.slice(dot + 1);
  return extToMime.get(ext) ?? null;
}

function resolveMime(file: File): { mime: string; ext: string } | null {
  let mime = file.type.trim().toLowerCase();
  if (!mime || mime === "application/octet-stream") {
    const fromName = mimeFromFileName(file.name);
    if (fromName) mime = fromName;
  }
  const ext = ALLOWED.get(mime);
  if (ext) return { mime, ext };
  return null;
}

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

  const resolved = resolveMime(file);
  if (!resolved) {
    return NextResponse.json(
      { error: "Faqat JPEG, PNG, WebP yoki GIF yuklash mumkin." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${resolved.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "questions");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
    console.error("[question-images] disk write failed", dir, code, e);
    const hint =
      code === "EACCES" || code === "EPERM"
        ? " Server: public/uploads papkasiga yozish huquqi yo‘q (chown/chmod yoki PM2 user)."
        : code === "ENOSPC"
          ? " Server: disk to‘ldi."
          : "";
    return NextResponse.json(
      { error: `Rasmni saqlab bo‘lmadi.${hint}` },
      { status: 500 },
    );
  }

  const url = `/uploads/questions/${name}`;
  return NextResponse.json({ url });
}
