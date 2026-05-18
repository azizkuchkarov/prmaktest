"use client";

import { useState, type ReactNode } from "react";

type Props = {
  className?: string;
  defaultOpen: boolean;
  /** `open` holatida strelka va boshqa elementlarni moslash uchun */
  summary: (open: boolean) => ReactNode;
  children: ReactNode;
};

/** `<details>` uchun boshlang‘ich ochiq/yopiq + React `open` tiplari bilan mos. */
export function AccordionDetails({ className, defaultOpen, summary, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className={className} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      {summary(open)}
      {children}
    </details>
  );
}
