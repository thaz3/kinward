"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageFocus() {
  const pathname = usePathname();

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("#page-heading");
    heading?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
