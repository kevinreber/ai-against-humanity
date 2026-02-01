"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
  );

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
