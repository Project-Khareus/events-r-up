import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simple hash function for device fingerprint
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Parse user agent to get readable device name
function parseUserAgent(ua) {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get device information from request
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    
    // Create device fingerprint (hash of user agent)
    const deviceFingerprint = await hashString(userAgent);
    const deviceName = parseUserAgent(userAgent);

    // Check if this device exists for the user
    const existingDevices = await base44.entities.UserDevice.filter({
      user_id: user.id,
      device_fingerprint: deviceFingerprint
    });

    if (existingDevices.length === 0) {
      // New device detected - create notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: user.id,
        type: 'system',
        title: '🔐 New Device Login',
        message: `A login was detected from a new device: ${deviceName}. If this wasn't you, please secure your account immediately.`,
        link: 'MyProfile'
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'New Device Login Detected',
        body: `
          Hello ${user.full_name},
          
          We detected a login to your Omnievents account from a new device:
          
          Device: ${deviceName}
          IP Address: ${ipAddress}
          Time: ${new Date().toLocaleString()}
          
          If this was you, you can safely ignore this email. If you don't recognize this login, please secure your account immediately by changing your password.
          
          Best regards,
          The Omnievents Team
        `
      });

      // Store the new device
      await base44.entities.UserDevice.create({
        user_id: user.id,
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        ip_address: ipAddress,
        device_name: deviceName,
        last_login: new Date().toISOString()
      });

      return Response.json({ 
        success: true, 
        isNewDevice: true,
        deviceName 
      });
    } else {
      // Known device - just update last login time
      await base44.entities.UserDevice.update(existingDevices[0].id, {
        last_login: new Date().toISOString(),
        ip_address: ipAddress
      });

      return Response.json({ 
        success: true, 
        isNewDevice: false,
        deviceName 
      });
    }
  } catch (error) {
    console.error('Device check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});