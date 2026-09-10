"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";

export default function Providers({ children }) {
  return (
    <SessionProvider><LanguageProvider>{children}</LanguageProvider></SessionProvider>
  );
}
