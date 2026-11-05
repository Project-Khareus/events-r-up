import React, { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SlackBugItem from '@/components/admin/SlackBugItem';

export default function AdminBugs() {
  const [error, setError] = useState('');
  const client = useQueryClient();
  const user = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), retry: false });
  const bugs = useInfiniteQuery({ queryKey: ['slackBugs'], enabled: user.data?.role === 'admin', initialPageParam: null,
    queryFn: ({ pageParam }) => base44.entities.SlackBug.list({ sort: '-created_date', limit: 50, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const change = useMutation({ mutationFn: ({ id, status }) => base44.entities.SlackBug.update(id, { status }), onSuccess: () => { setError(''); client.invalidateQueries({ queryKey: ['slackBugs'] }); }, onError: () => setError('Could not update the status. Please try again.') });
  useEffect(() => { if (user.data?.role !== 'admin') return; return base44.entities.SlackBug.subscribe(() => client.invalidateQueries({ queryKey: ['slackBugs'] })); }, [user.data?.role, client]);
  if (user.isLoading) return <div className="p-8">Loading…</div>;
  if (user.data?.role !== 'admin') return <div className="p-8">Admin access required.</div>;
  const entries = bugs.data?.pages.flatMap(page => page.items) || [];
  return <div className="min-h-screen bg-cream dark:bg-ink px-5 py-12"><div className="mx-auto max-w-3xl space-y-7">
    <header><h1 className="font-serif text-4xl text-foreground">Bug list</h1><p className="mt-2 text-muted-foreground">Review messages from Slack #bugs and update their status as work progresses.</p></header>
    <Button asChild variant="outline"><Link to="/AdminBugReviewer">Open bug review agent</Link></Button>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    {bugs.isLoading ? <p>Loading bugs…</p> : bugs.isError ? <p role="alert" className="text-destructive">Could not load the bug list.</p> : entries.length === 0 ? <p className="text-muted-foreground">No bug messages yet.</p> : <div className="space-y-3">
      {entries.map(bug => <SlackBugItem key={bug.id} bug={bug} onStatusChange={(id, status) => change.mutate({ id, status })} busy={change.isPending} />)}
      {bugs.hasNextPage && <Button variant="outline" onClick={() => bugs.fetchNextPage()} disabled={bugs.isFetchingNextPage}>{bugs.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button>}
    </div>}
  </div></div>;
}