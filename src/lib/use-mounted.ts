"use client";

import { useEffect, useState } from "react";

/** 避免 zustand persist 数据造成 SSR/CSR 水合不一致。 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
