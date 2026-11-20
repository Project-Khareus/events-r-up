import React, { useCallback, useState } from 'react';
import DiditVerificationDialog from '@/components/vendor/DiditVerificationDialog';

export default function GhanaCardVerification() {
  const [open, setOpen] = useState(true);
  const notify = useCallback((result) => {
    if (window.opener) window.opener.postMessage({ type: 'khareus:didit-result', session_id: result.session_id }, window.location.origin);
  }, []);
  const close = () => { setOpen(false); window.close(); };
  return <main className="min-h-screen bg-cream p-6 text-ink"><DiditVerificationDialog open={open} onOpenChange={(value) => value ? setOpen(true) : close()} onResult={notify} onSubmitPending={close} />{!open && <p>Return to your listing to continue.</p>}</main>;
}