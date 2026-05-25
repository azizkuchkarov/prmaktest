export type AdminListContext = "userlar" | "oqituvchilar";

/** Form maydalari: redirect qaysi sahifaga qaytish */
export function parseAdminListContext(raw: unknown): AdminListContext {
  const v = typeof raw === "string" ? raw.trim() : "";
  return v === "oqituvchilar" ? "oqituvchilar" : "userlar";
}

export function adminListPath(ctx: AdminListContext): "/admin/userlar" | "/admin/oqituvchilar" {
  return ctx === "oqituvchilar" ? "/admin/oqituvchilar" : "/admin/userlar";
}
