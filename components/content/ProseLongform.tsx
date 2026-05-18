import { RenderFractionText } from "@/components/math/RenderFractionText";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Admin matnida [[1/2]] bo‘lsa */
  renderMath?: boolean;
};

/**
 * Ko‘p qatorli matnni bo‘limlar sifatida chiroyli chiqaradi (yangilik, test tavsifi).
 */
export function ProseLongform({ text, className, renderMath = false }: Props) {
  const raw = text.trim();
  if (!raw) return null;
  const paras = raw.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div
      className={cn(
        "space-y-4 text-[1.0625rem] leading-[1.75] tracking-tight text-slate-700 antialiased sm:text-[1.0875rem] sm:leading-[1.8]",
        className,
      )}
    >
      {paras.map((p, i) => (
        <p key={i} className="whitespace-pre-wrap text-pretty first:mt-0">
          {renderMath ? <RenderFractionText text={p.trim()} /> : p.trim()}
        </p>
      ))}
    </div>
  );
}
