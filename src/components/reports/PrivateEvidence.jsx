import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

async function getUrl(fileUri) {
  if (/^https:\/\//i.test(fileUri)) return fileUri;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
  return signed_url;
}

export default function PrivateEvidence({ fileUri, label }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    getUrl(fileUri).then((url) => { if (active) setPreview(url); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [fileUri]);

  const open = async () => {
    const tab = window.open("", "_blank");
    if (!tab) { setError(true); return; }
    tab.opener = null;
    try { tab.location.href = await getUrl(fileUri); }
    catch { tab.close(); setError(true); }
  };

  return (
    <button type="button" onClick={open} className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 text-xs text-slate-600" aria-label={`Open ${label}`}>
      {preview ? <img src={preview} alt={label} className="h-full w-full object-cover" onError={() => setPreview("")} /> : (error ? "Unable to open" : label)}
    </button>
  );
}