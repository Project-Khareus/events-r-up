import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Clock, XCircle, RotateCcw, Send } from "lucide-react";
import { BTN_PRIMARY, BTN_GHOST } from "./steps/wizardStyles";

const DIDIT_ORIGIN = "https://verify.didit.me";
// Statuses that mean Didit hasn't written its decision yet right after the flow ends.
const NOT_DECIDED = ["not started", "in progress"];
const POLL_ATTEMPTS = 6;
const POLL_DELAY_MS = 2500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Opens Didit's hosted Ghana Card + selfie verification in a dialog, then shows the outcome.
 *
 * onResult({ session_id, status: "verified" | "pending" | "failed", message }) is called once
 * a result is known. onSubmitPending() is offered when the vendor wants to continue without
 * a successful verification.
 */
export default function DiditVerificationDialog({ open, onOpenChange, onResult, onSubmitPending }) {
  const [phase, setPhase] = useState("starting"); // starting | verifying | checking | result | error
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const checkingRef = useRef(false);

  const startSession = useCallback(async () => {
    setPhase("starting");
    setError("");
    setResult(null);
    setSession(null);
    startedRef.current = false;
    checkingRef.current = false;
    try {
      const { data } = await base44.functions.invoke("createDiditSession", {});
      if (!data?.url) throw new Error(data?.error || "Could not start verification");
      setSession(data);
      setPhase("verifying");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not start verification");
      setPhase("error");
    }
  }, []);

  const checkResult = useCallback(async (sessionId) => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setPhase("checking");
    let latest = null;
    try {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        const { data } = await base44.functions.invoke("getDiditSessionStatus", { session_id: sessionId });
        latest = data;
        if (!NOT_DECIDED.includes(String(data?.didit_status || "").toLowerCase())) break;
        await sleep(POLL_DELAY_MS);
      }
    } catch {
      // Fall through: treat as pending, the webhook will update the listing later.
    }
    const outcome = {
      session_id: sessionId,
      status: latest?.status || "pending",
      didit_status: latest?.didit_status,
      message: latest?.message || "We couldn't confirm your verification yet.",
    };
    setResult(outcome);
    setPhase("result");
    onResult?.(outcome);
  }, [onResult]);

  // Start a fresh session every time the dialog opens
  useEffect(() => {
    if (open) startSession();
  }, [open, startSession]);

  // Listen to events posted by Didit's verification page
  useEffect(() => {
    if (!open || !session) return undefined;
    const handler = (event) => {
      if (event.origin !== DIDIT_ORIGIN) return;
      const { type, data } = event.data || {};
      if (type === "didit:started" || type === "didit:step_started") startedRef.current = true;
      if (type === "didit:completed") checkResult(data?.sessionId || session.session_id);
      if (type === "didit:cancelled" || type === "didit:close_request") handleClose();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [open, session, checkResult]);

  // Closing mid-flow: if they had started, record where it got to so they can submit as pending.
  function handleClose() {
    if (phase === "verifying" && session && startedRef.current) {
      checkResult(session.session_id);
      return;
    }
    if (phase === "checking") return;
    onOpenChange(false);
  }

  const resultView = result && {
    verified: {
      icon: <ShieldCheck className="h-10 w-10 text-green-600" />,
      title: "Ghana Card verified",
      body: "Your Ghana Card and selfie were verified successfully. You can now submit your listing.",
    },
    pending: {
      icon: <Clock className="h-10 w-10 text-gold-text dark:text-gold-dark" />,
      title: "Verification pending",
      body: `${result.message} You can submit your listing now with Ghana Card verification pending. Check its status again by editing your listing.`, 
    },
    failed: {
      icon: <XCircle className="h-10 w-10 text-red-600" />,
      title: "Verification unsuccessful",
      body: "We couldn't verify your Ghana Card and selfie. Try again with clear, well-lit photos, or submit your listing with Ghana Card verification pending.",
    },
  }[result.status];

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent
        className="max-w-[480px] w-[calc(100vw-24px)] p-0 gap-0 overflow-hidden rounded-none"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
          <DialogTitle className="text-[17px] font-medium">Ghana Card verification</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Secured by Didit. Have your Ghana Card ready. You'll photograph both sides and take a selfie.
          </DialogDescription>
        </DialogHeader>

        {phase === "starting" && (
          <div className="h-[320px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-gold-text dark:text-gold-dark" />
            <p className="text-[13px] font-light">Starting secure verification…</p>
          </div>
        )}

        {phase === "verifying" && session && (
          <div>
            <iframe
              title="Didit identity verification"
              src={session.url}
              className="w-full h-[65vh] max-h-[630px] border-0 block"
              allow="camera; microphone; geolocation; clipboard-write; fullscreen; autoplay; encrypted-media; digital-credentials-get"
            />
            <div className="p-3 text-center"><button type="button" className={BTN_PRIMARY} onClick={() => checkResult(session.session_id)}>I’ve finished verification</button></div>
          </div>
        )}

        {phase === "checking" && (
          <div className="h-[320px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-gold-text dark:text-gold-dark" />
            <p className="text-[13px] font-light">Checking your verification result…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="p-6 text-center space-y-4">
            <XCircle className="h-10 w-10 mx-auto text-red-600" />
            <p className="text-[13.5px] font-light">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button type="button" className={BTN_GHOST} onClick={startSession}>
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
              <button type="button" className={BTN_PRIMARY} onClick={() => { onOpenChange(false); onSubmitPending?.(); }}>
                <Send className="h-4 w-4" /> Submit with verification pending
              </button>
            </div>
          </div>
        )}

        {phase === "result" && resultView && (
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">{resultView.icon}</div>
            <h3 className="text-[19px] font-medium text-ink dark:text-[#F1E8E0]">{resultView.title}</h3>
            <p className="text-[13.5px] font-light leading-[1.6] text-[rgba(59,50,43,0.72)] dark:text-[rgba(241,232,224,0.72)]">
              {resultView.body}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
              {result.status === "verified" ? (
                <button type="button" className={BTN_PRIMARY} onClick={() => onOpenChange(false)}>
                  Continue
                </button>
              ) : (
                <>
                  {result.status === "failed" && (
                    <button type="button" className={BTN_GHOST} onClick={startSession}>
                      <RotateCcw className="h-4 w-4" /> Try again
                    </button>
                  )}
                  <button type="button" className={BTN_PRIMARY} onClick={() => { onOpenChange(false); onSubmitPending?.(); }}>
                    <Send className="h-4 w-4" /> Submit with verification pending
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}