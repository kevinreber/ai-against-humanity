"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    if (!CONVEX_URL) {
      return null;
    }
    return new ConvexReactClient(CONVEX_URL);
  });

  if (!client) {
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
