import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BugReviewerChat from '@/components/admin/BugReviewerChat';

export default function AdminBugReviewer() {
  const { data: user, isLoading } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), retry: false });
  if (isLoading) return <div className="p-8">Loading…</div>;
  if (user?.role !== 'admin') return <div className="p-8">Admin access required.</div>;
  return <div className="min-h-screen bg-cream dark:bg-ink px-5 py-12"><div className="mx-auto max-w-3xl space-y-7"><header><h1 className="font-serif text-4xl text-foreground">Bug review agent</h1><p className="mt-2 text-muted-foreground">Ask the agent to review reports. It will say when more evidence is needed.</p></header><BugReviewerChat /></div></div>;
}