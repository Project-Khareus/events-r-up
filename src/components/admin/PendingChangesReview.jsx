import { useMemo } from "react";
import { AlertTriangle, ArrowRight, ImageIcon, Plus, Minus, Star } from "lucide-react";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import { GROUPS, getPendingChanges, getNameChangeReasons } from "@/lib/vendorPendingChanges";

// Word-level diff (LCS) so admins can see exactly what changed in long text.
function diffWords(before, after) {
  const a = (before || "").split(/(\s+)/).filter((t) => t !== "");
  const b = (after || "").split(/(\s+)/).filter((t) => t !== "");
  if (a.length * b.length > 400000) return null; // very long text: fall back to before/after
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text; else out.push({ type, text });
  };
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push("same", a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push("removed", a[i]); i++; }
    else { push("added", b[j]); j++; }
  }
  while (i < a.length) push("removed", a[i++]);
  while (j < b.length) push("added", b[j++]);
  return out;
}

const empty = <span className="italic text-slate-400">Not set</span>;

function money(amount, code) {
  if (amount === null || amount === undefined) return null;
  try { return formatPrice(amount, getCurrencyByCode(code)); } catch { return `${code} ${amount}`; }
}

function Chip({ tone, children }) {
  const tones = {
    added: "bg-emerald-50 text-emerald-800 border-emerald-200",
    removed: "bg-red-50 text-red-700 border-red-200 line-through decoration-red-400",
    kept: "bg-white text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[13px] ${tones[tone]}`}>
      {tone === "added" && <Plus className="h-3 w-3" aria-label="Added" />}
      {tone === "removed" && <Minus className="h-3 w-3" aria-label="Removed" />}
      {children}
    </span>
  );
}

function LinkOrText({ value, kind }) {
  if (value === null) return empty;
  if (kind === "url" && /^https?:\/\//i.test(value)) {
    return <a href={value} target="_blank" rel="noopener noreferrer" className="text-sky-800 underline underline-offset-2 break-all">{value}</a>;
  }
  return <span className="break-words">{value}</span>;
}

function BeforeAfter({ before, after }) {
  return (
    <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-start">
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">Live now</p>
        <div className="text-sm text-slate-500">{before}</div>
      </div>
      <ArrowRight className="hidden sm:block h-4 w-4 text-slate-300 mt-6" aria-hidden="true" />
      <div className="rounded-md bg-emerald-50/60 border border-emerald-200 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-emerald-700 mb-0.5">Proposed</p>
        <div className="text-sm text-slate-900 font-medium">{after}</div>
      </div>
    </div>
  );
}

function Thumb({ src, tone, label }) {
  const ring = tone === "added" ? "ring-2 ring-emerald-400" : tone === "removed" ? "ring-2 ring-red-300 opacity-50" : "ring-1 ring-slate-200";
  return (
    <figure className="w-20">
      {src
        ? <img src={src} alt={label} className={`w-20 h-20 object-cover rounded-md ${ring}`} loading="lazy" />
        : <div className={`w-20 h-20 rounded-md bg-slate-100 grid place-items-center ${ring}`}><ImageIcon className="h-5 w-5 text-slate-300" /></div>}
      <figcaption className={`mt-1 text-[11px] text-center ${tone === "added" ? "text-emerald-700" : tone === "removed" ? "text-red-600" : "text-slate-400"}`}>{label}</figcaption>
    </figure>
  );
}

function ChangeBody({ change }) {
  const { kind } = change;

  if (kind === "list") {
    const label = (v) => change.labels?.[v] || v;
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {change.added.map((v) => <Chip key={`a-${v}`} tone="added">{label(v)}</Chip>)}
          {change.removed.map((v) => <Chip key={`r-${v}`} tone="removed">{label(v)}</Chip>)}
          {change.kept.map((v) => <Chip key={`k-${v}`} tone="kept">{label(v)}</Chip>)}
        </div>
        {change.newMain && change.before?.length > 0 && (
          <p className="text-xs text-slate-600 flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />Main location becomes <strong>{change.newMain}</strong></p>
        )}
      </div>
    );
  }

  if (kind === "longtext") {
    const parts = diffWords(change.before, change.after);
    if (!parts) return <BeforeAfter before={change.before ?? empty} after={change.after ?? empty} />;
    return (
      <p className="text-sm leading-relaxed text-slate-700 rounded-md border border-slate-200 bg-white px-3 py-2.5">
        {parts.map((p, i) => p.type === "same"
          ? <span key={i}>{p.text}</span>
          : p.type === "added"
            ? <ins key={i} className="no-underline bg-emerald-100 text-emerald-900 rounded-sm px-0.5">{p.text}</ins>
            : <del key={i} className="bg-red-100 text-red-700 line-through rounded-sm px-0.5">{p.text}</del>)}
      </p>
    );
  }

  if (kind === "price") {
    const before = money(change.before, change.currencyBefore);
    const after = money(change.after, change.currencyAfter);
    let delta = null;
    if (change.before && change.after && change.currencyBefore === change.currencyAfter) {
      const pct = Math.round(((change.after - change.before) / change.before) * 100);
      if (pct) delta = <span className={`ml-2 text-xs font-semibold ${pct > 0 ? "text-amber-700" : "text-emerald-700"}`}>{pct > 0 ? "+" : ""}{pct}%</span>;
    }
    return <BeforeAfter before={before ?? empty} after={<>{after ?? empty}{delta}</>} />;
  }

  if (kind === "number") {
    return <BeforeAfter before={change.before ?? empty} after={change.after ?? empty} />;
  }

  if (kind === "image") {
    return (
      <div className="flex items-center gap-4">
        <Thumb src={change.before} tone="kept" label="Live now" />
        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" aria-hidden="true" />
        {change.after ? <Thumb src={change.after} tone="added" label="Proposed" /> : <Thumb src={null} tone="removed" label="Removed" />}
      </div>
    );
  }

  if (kind === "gallery") {
    const isVideo = change.key === "gallery_videos";
    const parts = [];
    if (change.added.length) parts.push(`${change.added.length} added`);
    if (change.removed.length) parts.push(`${change.removed.length} removed`);
    if (change.kept.length) parts.push(`${change.kept.length} unchanged`);
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-600">{parts.join(" · ")}</p>
        {!isVideo && (
          <div className="flex flex-wrap gap-3">
            {change.added.map((src) => <Thumb key={`a-${src}`} src={src} tone="added" label="New" />)}
            {change.removed.map((src) => <Thumb key={`r-${src}`} src={src} tone="removed" label="Removed" />)}
          </div>
        )}
        {isVideo && (change.added.length > 0 || change.removed.length > 0) && (
          <ul className="text-xs space-y-1">
            {change.added.map((u) => <li key={`a-${u}`} className="text-emerald-700 break-all">+ <a href={u} target="_blank" rel="noopener noreferrer" className="underline">{u}</a></li>)}
            {change.removed.map((u) => <li key={`r-${u}`} className="text-red-600 break-all line-through">{u}</li>)}
          </ul>
        )}
      </div>
    );
  }

  return <BeforeAfter before={<LinkOrText value={change.before} kind={kind} />} after={<LinkOrText value={change.after} kind={kind} />} />;
}

// Clear review of a vendor's proposed edits, grouped by section.
export default function PendingChangesReview({ vendor, compact = false }) {
  const changes = useMemo(() => getPendingChanges(vendor), [vendor]);
  const reasons = getNameChangeReasons(vendor);
  if (!vendor?.has_pending_changes) return null;

  if (changes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        This update doesn't change anything customers can see. Approving or rejecting it will simply clear it.
      </div>
    );
  }

  const nameChange = changes.find((c) => c.key === "business_name");
  const grouped = GROUPS.map((g) => ({ ...g, items: changes.filter((c) => c.group === g.id) })).filter((g) => g.items.length);

  return (
    <section aria-label="Proposed changes" className={`rounded-xl border border-amber-200 bg-white overflow-hidden ${compact ? "" : "mb-6"}`}>
      <header className="px-4 sm:px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-semibold text-slate-900">
          {changes.length} change{changes.length !== 1 ? "s" : ""} to review
        </h3>
        <p className="text-sm text-slate-600">
          {grouped.map((g) => `${g.label} (${g.items.length})`).join(" · ")}
        </p>
      </header>

      {nameChange && (
        <div className="mx-4 sm:mx-5 mt-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50/70 px-3.5 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Business name change: check this carefully</p>
            <p className="text-slate-700">
              <span className="line-through text-slate-500">{nameChange.before}</span>
              <ArrowRight className="inline h-3.5 w-3.5 mx-1.5 text-slate-400" aria-hidden="true" />
              <strong>{nameChange.after}</strong>
            </p>
            {reasons.length > 0 && <p className="mt-1 text-slate-600">Reason given: {reasons.join(", ")}</p>}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-5 py-4 space-y-5">
        {grouped.map((group) => (
          <div key={group.id}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">{group.label}</h4>
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {group.items.map((change) => (
                <div key={change.key} className="grid md:grid-cols-[170px_1fr] gap-x-4 gap-y-2 px-3.5 py-3">
                  <dt className="text-sm font-medium text-slate-800 md:pt-1.5">{change.label}</dt>
                  <dd className="min-w-0"><ChangeBody change={change} /></dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <footer className="px-4 sm:px-5 pb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-200" />Added</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-200" />Removed</span>
        <span>Approving applies all {changes.length} change{changes.length !== 1 ? "s" : ""} to the live listing.</span>
      </footer>
    </section>
  );
}
