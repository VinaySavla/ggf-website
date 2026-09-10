"use client";
import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext({ language: "en", setLanguage: () => {}, t: (key) => key });
const strings = {
  en: { home: "Home", events: "Events", gallery: "Gallery", community: "Community", about: "About", dashboard: "Dashboard", login: "Login" },
  gu: { home: "હોમ", events: "કાર્યક્રમો", gallery: "ગેલેરી", community: "સમુદાય", about: "અમારા વિશે", dashboard: "ડેશબોર્ડ", login: "લૉગિન" },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  useEffect(() => { setLanguageState(localStorage.getItem("ggf-language") || "en"); }, []);
  function setLanguage(value) { setLanguageState(value); localStorage.setItem("ggf-language", value); document.cookie = `ggf-language=${value};path=/;max-age=31536000;SameSite=Lax`; }
  return <LanguageContext.Provider value={{ language, setLanguage, t: (key) => strings[language]?.[key] || strings.en[key] || key }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
