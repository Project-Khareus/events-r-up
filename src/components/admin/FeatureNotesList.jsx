import React from 'react';
import { Button } from '@/components/ui/button';

export default function FeatureNotesList({ pages, onDelete, deleting, onMore, hasMore, loadingMore }) {
  const notes = pages.flatMap(page => page.items);
  if (!notes.length) return <p className="text-sm text-muted-foreground">No feature notes yet.</p>;
  return <div className="space-y-3">
    {notes.map(note => <div key={note.id} className="border border-border bg-card p-4 flex items-start justify-between gap-4">
      <div className="min-w-0"><p className="whitespace-pre-wrap break-words text-foreground">{note.description}</p><p className="mt-2 text-xs text-muted-foreground">{note.status === 'sent' ? `Sent · ${new Date(note.published_at).toLocaleDateString()}` : 'Queued for next publish'}</p></div>
      {note.status === 'pending' && <Button variant="outline" size="sm" disabled={deleting} onClick={() => onDelete(note.id)}>Remove</Button>}
    </div>)}
    {hasMore && <Button variant="outline" onClick={onMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Button>}
  </div>;
}