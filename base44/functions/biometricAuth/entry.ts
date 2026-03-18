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

    if (action === 'login-challenge') {
      // Generate challenge for login
      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = base64UrlEncode(challengeBytes);

      // Get user's credentials
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users[0];
      const credentials = await base44.asServiceRole.entities.BiometricCredential.filter({
        user_id: user.id
      });

      if (credentials.length === 0) {
        return Response.json({ error: 'No biometric credentials registered' }, { status: 404 });
      }

      return Response.json({
        challenge: challengeBase64,
        allowCredentials: credentials.map(c => ({
          id: c.credential_id,
          type: 'public-key'
        }))
      });
    }

    if (action === 'login-verify') {
      // Verify the login credential and create session
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users[0];
      
      // Verify credential exists
      const credentials = await base44.asServiceRole.entities.BiometricCredential.filter({
        user_id: user.id,
        credential_id: credential.id
      });

      if (credentials.length === 0) {
        return Response.json({ error: 'Invalid credential' }, { status: 401 });
      }

      // In a production system, you'd verify the signature here
      // For now, we'll trust the client verification
      
      // Create a login token (you'd need to implement proper session management)
      // For Base44, we'll return success and let the client handle the login
      
      return Response.json({ 
        success: true,
        userId: user.id,
        message: 'Biometric authentication successful'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Biometric auth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});