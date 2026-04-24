import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, LogOut, Shield, Mail, Loader2, CheckCircle, Smartphone } from "lucide-react";

export default function SecuritySection({ user }) {
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    setResetSending(true);
    try {
      await base44.auth.resetPasswordRequest(user.email);
      setResetSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error("Could not send reset email. Please try logging out and using 'Forgot Password' on the login page.");
    } finally {
      setResetSending(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
        <Shield className="h-5 w-5 text-indigo-500" />
        Security Settings
      </h2>

      <div className="space-y-8">
        {/* Account Info */}
        <div className="space-y-4">
          <div>
            <Label>Email (used to sign in)</Label>
            <Input value={user.email} disabled className="bg-slate-50 dark:bg-slate-900 mt-1" />
            <p className="text-xs text-slate-500 mt-1">This is the email you use to log in to your account</p>
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={user.full_name || ''} disabled className="bg-slate-50 dark:bg-slate-900 mt-1" />
          </div>
        </div>

        {/* Password Reset */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-500" />
            Password
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Reset your password by receiving a secure link to your email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {resetSent ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-4 py-2.5 rounded-lg">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">
                  Reset link sent to <strong>{user.email}</strong> — check your inbox (and spam folder).
                </span>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handlePasswordReset}
                disabled={resetSending}
                className="w-full sm:w-auto"
              >
                {resetSending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" /> Send Password Reset Email</>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-3">
            You can also reset your password from the login page by clicking <strong>"Forgot Password?"</strong>
          </p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-500" />
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Add an extra layer of security to your account. When enabled, you'll need to enter a verification code in addition to your password each time you sign in.
          </p>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Recommended: Enable 2FA</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Protect your vendor account from unauthorized access. Two options are available:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium text-sm text-slate-900 dark:text-white">Authenticator App</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use Google Authenticator, Duo, or similar apps to generate one-time codes.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium text-sm text-slate-900 dark:text-white">SMS Verification</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive a verification code via text message to your phone.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>How to enable 2FA:</strong> Click your profile icon at the top right → Account Settings → Scroll to "Two-Factor Authentication" → Click Enable and follow the instructions.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => base44.auth.logout(window.location.origin)}
            className="w-full sm:w-auto text-slate-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
}