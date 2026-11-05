import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function BugReviewerChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!conversation?.id) return;
    return base44.agents.subscribeToConversation(conversation.id, data => setMessages(data.messages || []));
  }, [conversation?.id]);
  const send = async e => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const active = conversation || await base44.agents.createConversation({ agent_name: 'bug_reviewer', metadata: { name: 'Bug review' } });
      if (!conversation) setConversation(active);
      const content = text.trim();
      await base44.agents.addMessage(active, { role: 'user', content });
      setText('');
    } catch { setError('Could not send your message. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4" aria-label="Bug review conversation">
    <div className="space-y-3" aria-live="polite">{messages.map((message, i) => <div key={i} className="border border-border bg-card p-4"><p className="mb-2 text-xs font-medium text-muted-foreground">{message.role === 'user' ? 'You' : 'Bug reviewer'}</p><div className="prose prose-sm dark:prose-invert max-w-none break-words"><ReactMarkdown>{message.content || ''}</ReactMarkdown></div></div>)}</div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <form onSubmit={send} className="space-y-3"><label htmlFor="bug-review-message" className="text-sm font-medium">Ask about a bug report</label><Textarea id="bug-review-message" value={text} onChange={e => setText(e.target.value)} placeholder="Which bug would you like to review?" /><Button type="submit" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Send'}</Button></form>
  </section>;
}