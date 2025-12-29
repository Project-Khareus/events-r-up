import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BiometricLogin({ onSuccess, email }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(available);
      }
    };
    checkSupport();
  }, []);

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const base64ToArrayBuffer = (base64) => {
    const str = base64.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - str.length % 4) % 4);
    const binary = atob(str + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    setIsLoading(true);
    try {
      // Get challenge from server
      const { data: challengeData } = await base44.functions.invoke('biometricAuth', {
        action: 'login-challenge',
        email
      });

      if (challengeData.error) {
        toast.error(challengeData.error);
        return;
      }

      // Perform WebAuthn authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: base64ToArrayBuffer(challengeData.challenge),
          allowCredentials: challengeData.allowCredentials.map(c => ({
            id: base64ToArrayBuffer(c.id),
            type: c.type,
            transports: ['internal']
          })),
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (!credential) {
        toast.error('Authentication cancelled');
        return;
      }

      // Verify with server
      const { data: verifyData } = await base44.functions.invoke('biometricAuth', {
        action: 'login-verify',
        email,
        credential: {
          id: arrayBufferToBase64(credential.rawId),
          response: {
            authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
            signature: arrayBufferToBase64(credential.response.signature)
          }
        },
        challenge: challengeData.challenge
      });

      if (verifyData.success) {
        toast.success('Successfully authenticated with Face ID!');
        onSuccess?.();
      } else {
        toast.error('Authentication failed');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      toast.error('Failed to authenticate with biometrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setIsLoading(true);
    try {
      // Get challenge from server
      const { data: challengeData } = await base44.functions.invoke('biometricAuth', {
        action: 'register-challenge'
      });

      if (challengeData.error) {
        toast.error(challengeData.error);
        return;
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64ToArrayBuffer(challengeData.challenge),
          rp: {
            name: 'Omnievents',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(challengeData.user.id),
            name: challengeData.user.name,
            displayName: challengeData.user.displayName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      if (!credential) {
        toast.error('Registration cancelled');
        return;
      }

      // Send to server
      const { data: registerData } = await base44.functions.invoke('biometricAuth', {
        action: 'register-verify',
        credential: {
          id: arrayBufferToBase64(credential.rawId),
          publicKey: arrayBufferToBase64(credential.response.getPublicKey()),
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'iOS Device'
        }
      });

      if (registerData.success) {
        toast.success('Face ID registered successfully!');
      }
    } catch (error) {
      console.error('Biometric registration error:', error);
      toast.error('Failed to register biometrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={email ? handleBiometricLogin : handleRegisterBiometric}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <Fingerprint className="h-5 w-5 mr-2" />
        )}
        {email ? 'Sign in with Face ID' : 'Enable Face ID'}
      </Button>
      {!email && (
        <p className="text-xs text-slate-500 text-center">
          You must be logged in to register Face ID
        </p>
      )}
    </div>
  );
}