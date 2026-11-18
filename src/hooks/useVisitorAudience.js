import { useCallback, useState } from "react";

// Decides whether the homepage speaks to visitors in Ghana ("local") or to
// people booking Ghanaian vendors from elsewhere ("abroad"). Detection uses
// the browser's time zone and language, needs no network call, and is only a
// default: the visitor can switch, and their choice is remembered.

const STORAGE_KEY = "khareus_audience";

function detectAudience() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Africa/Accra") return "local";
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    if (langs.some((l) => /-GH$/i.test(l || ""))) return "local";
    // Unknown time zone: keep the existing Ghana experience.
    if (!tz) return "local";
    return "abroad";
  } catch {
    return "local";
  }
}

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "local" || v === "abroad" ? v : null;
  } catch {
    return null;
  }
}

export default function useVisitorAudience() {
  const [audience, setAudienceState] = useState(() => readStored() || detectAudience());

  const setAudience = useCallback((next) => {
    setAudienceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return { audience, setAudience };
}
