import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Base64 URL encoding helpers
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, email, credential, challenge } = await req.json();

    if (action === 'register-challenge') {
      // User wants to register biometric auth
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Generate random challenge
      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = base64UrlEncode(challengeBytes);

      // Store challenge in user session (you might want to use a temporary storage)
      // For now, we'll return it and expect it back
      
      return Response.json({
        challenge: challengeBase64,
        user: {
          id: user.id,
          name: user.full_name,
          displayName: user.full_name
        }
      });
    }

    if (action === 'register-verify') {
      // Verify and store the credential
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Store the credential
      await base44.entities.BiometricCredential.create({
        user_id: user.id,
        credential_id: credential.id,
        public_key: credential.publicKey,
        device_name: credential.deviceName || 'iOS Device',
        counter: 0
      });

      return Response.json({ success: true });
    }

    if (action === 'login-challenge' || action === 'login-verify') {
      // Passwordless biometric sign-in is disabled: this endpoint cannot perform
      // server-side WebAuthn assertion verification, so accepting it would allow
      // account impersonation. Biometrics are only used to register a credential
      // for an already-authenticated user.
      return Response.json(
        { error: 'Biometric sign-in is not available. Please sign in with your account.' },
        { status: 501 }
      );
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Biometric auth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});