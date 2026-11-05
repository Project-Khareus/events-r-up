import React from 'react';

export default function SlackBugItem({ bug, onStatusChange, busy }) {
  const timestamp = Number(bug.slack_timestamp);
  const link = /^\d{1,16}\.\d{1,10}$/.test(bug.slack_timestamp || '') && /^C[A-Z0-9]+$/.test(bug.slack_channel || '') ? `https://app.slack.com/archives/${bug.slack_channel}/p${bug.slack_timestamp.replace('.', '')}` : null;
  return <article className="border border-border bg-card p-4 space-y-3">
    <p className="whitespace-pre-wrap break-words text-foreground">{bug.message}</p>
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span>{Number.isFinite(timestamp) ? new Date(timestamp * 1000).toLocaleString() : ''}</span>
      {bug.slack_user && <span>Slack user: {bug.slack_user}</span>}
      {link && <a href={link} target="_blank" rel="noreferrer" className="text-gold-text dark:text-gold-dark underline">View in Slack</a>}
      <label className="ml-auto flex items-center gap-2">Status
        <select value={bug.status} disabled={busy} onChange={e => onStatusChange(bug.id, e.target.value)} className="border border-input bg-background p-2 text-foreground">
          <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
        </select>
      </label>
    </div>
  </article>;
}