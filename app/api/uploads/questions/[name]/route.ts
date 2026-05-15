import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAFE_NAME = /^[a-f0-9-]{20,}\.(jpg|jpeg|png|webp|gif)$/i;

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * `/uploads/questions/...` URL ichki rewrite bilan shu route ga keladi.
 * VPS da builddan keyin qo‘shilgan fayllar uchun `public/` statik 404 bermasligi uchun.
 */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const name = path.basename(raw);
  if (!SAFE_NAME.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dir = path.resolve(process.cwd(), "public", "uploads", "questions");
  const filePath = path.resolve(dir, name);
  if (!filePath.startsWith(dir + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
