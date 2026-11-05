import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FeatureNotesList from '@/components/admin/FeatureNotesList';

export default function AdminReleaseNotes() {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), retry: false });
  const notes = useInfiniteQuery({ queryKey: ['featureReleaseNotes'], enabled: user.data?.role === 'admin', initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.FeatureReleaseNote.list({ sort: '-created_date', limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['featureReleaseNotes'] });
  const add = useMutation({ mutationFn: text => base44.entities.FeatureReleaseNote.create({ description: text, status: 'pending' }), onSuccess: () => { setDescription(''); setError(''); refresh(); }, onError: () => setError('Could not save the note. Please try again.') });
  const remove = useMutation({ mutationFn: id => base44.entities.FeatureReleaseNote.delete(id), onSuccess: refresh, onError: () => setError('Could not remove the note. Please try again.') });
  if (user.isLoading) return <div className="p-8">Loading…</div>;
  if (user.data?.role !== 'admin') return <div className="p-8">Admin access required.</div>;
  return <div className="min-h-screen bg-cream dark:bg-ink px-5 py-12"><div className="mx-auto max-w-2xl space-y-7">
    <header><h1 className="font-serif text-4xl text-foreground">Feature release notes</h1><p className="mt-2 text-muted-foreground">Add new features and improvements before publishing. Queued notes are sent to #features on the next publish. Do not add bug fixes.</p></header>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); const value = description.trim(); if (value) add.mutate(value); }}>
      <label htmlFor="feature-note" className="text-sm font-medium">Feature or improvement</label>
      <Textarea id="feature-note" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} required placeholder="Describe the feature or update" />
      <Button type="submit" disabled={add.isPending || !description.trim()}>{add.isPending ? 'Saving…' : 'Queue note'}</Button>
    </form>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <section className="space-y-3"><h2 className="font-serif text-2xl text-foreground">Release notes</h2>
      {notes.isLoading ? <p className="text-muted-foreground">Loading notes…</p> : notes.isError ? <p role="alert" className="text-destructive">Could not load release notes.</p> : <FeatureNotesList pages={notes.data?.pages || []} onDelete={id => remove.mutate(id)} deleting={remove.isPending} onMore={notes.fetchNextPage} hasMore={notes.hasNextPage} loadingMore={notes.isFetchingNextPage} />}
    </section>
  </div></div>;
}