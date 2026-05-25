import type { AdminListContext } from "@/lib/admin-list-context";

export function AdminListContextFields({
  vil,
  tel,
  context,
}: {
  vil?: string;
  tel?: string;
  context: AdminListContext;
}) {
  return (
    <>
      {vil ? <input type="hidden" name="redirectViloyat" value={vil} /> : null}
      {tel ? <input type="hidden" name="redirectTel" value={tel} /> : null}
      <input type="hidden" name="adminListContext" value={context} />
    </>
  );
}
