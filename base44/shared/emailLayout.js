const BRAND = 'Khareus';
export const SITE_URL = 'https://khareus.com';

export function emailTemplate(title, titleColor, content) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="padding: 32px 24px;">
            <h1 style="color: ${titleColor}; font-size: 24px; margin: 0 0 20px 0;">${title}</h1>
            ${content}
        </div>
        <div style="border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
            </p>
        </div>
    </div>`;
}

export function button(text, url, color = '#4F46E5') {
  return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;">${text}</a>`;
}

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function firstAdminEmail(base44) {
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  return admins && admins.length ? admins[0].email : null;
}