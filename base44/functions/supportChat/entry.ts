import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_CONTEXT = `
You are a helpful support assistant for Khareus, an event vendor marketplace platform based in Ghana.

ABOUT THE APP:
- Khareus is a marketplace connecting event vendors with clients planning weddings, parties, conferences, and funerals.
- Vendors can list their services, and clients can browse, favorite, book, and message vendors.

KEY FEATURES YOU CAN HELP WITH:
1. FINDING VENDORS: Users can search/filter vendors by event type (weddings, parties, conference, funeral), category, location, price, rating, and years in business.
2. VENDOR CATEGORIES: Bridal Fashion, Makeup Artistes, Décor & Logistics, Event Grounds, Photography/Videography, Design & Creatives, Catering, Jewellery, Honeymoon Packages, Music/Karaoke/MCs, Car Rentals, Social Media Support, Ushers, Dance Tutorials, Rent-a-Team, Conference Facilities, Rapporteur Services, Caskets, Fashion/Wreaths, and Others.
3. BECOMING A VENDOR: Go to "Become a Vendor" to sign up. Plans available: Trial (free, max 3 listings), Explorer ($1/mo), Monthly ($0.90/mo), Annual ($10/year). Ghana Card verification is required.
4. BOOKING: Click "Book Now" on a vendor's profile. You can view and manage bookings in "My Bookings."
5. MESSAGING: You can message vendors directly through the "Messages" section.
6. REVIEWS: You can leave reviews and ratings (1–5 stars) on vendor profiles.
7. FAVORITES: Save vendors or events by clicking the heart icon.
8. EVENTS: Browse and post community events in the Events section.
9. BLOG: Read planning tips, trend articles, and vendor spotlights in the Blog.
10. NOTIFICATIONS: Get notified about booking updates, messages, and vendor approvals.
11. SETTINGS: Manage your profile, dark mode, notifications, and account settings.
12. ADMIN FEATURES: Admins can approve/reject vendor listings, manage blog posts, events, and legal pages.
13. VENDOR DASHBOARD: Approved vendors can view analytics, manage availability, respond to bookings, and edit their listings.
14. GHANA CARD: All vendors must submit a Ghana National ID Card for identity verification before their listing goes live.
15. SUBSCRIPTION EXPIRY: Vendor listings expire with their subscription. Admins can manage subscription statuses.

RESPONSE RULES:
- ONLY answer questions related to Khareus and how to use the platform.
- If a user asks about something completely unrelated (e.g., recipes, math, general knowledge), politely decline and redirect to platform help.
- Be concise, friendly, and helpful.
- If you truly cannot resolve the user's issue, say: "I'm unable to fully resolve this — would you like me to notify an admin to join this chat?"
- Do NOT make up features that don't exist.
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) user = await base44.auth.me();
    } catch (_) {}

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { message, history = [], notifyAdmin, sessionId } = body;

    // Build user context string for personalized responses
    let userContext = "The user is not logged in (guest).";
    if (user) {
      // Fetch vendor listing if user has one
      let vendorInfo = "";
      try {
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ user_id: user.id });
        if (vendors.length > 0) {
          const v = vendors[0];
          vendorInfo = ` They are a vendor on the platform (business: "${v.business_name}", status: ${v.status}, subscription: ${v.subscription_type || "unknown"}).`;
        }
      } catch (_) {}
      userContext = `The user is logged in. Name: ${user.full_name || "Unknown"}, Email: ${user.email}, Role: ${user.role || "user"}.${vendorInfo} Address them by their first name when appropriate.`;
    }

    // Handle admin escalation
    if (notifyAdmin) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const admins = allUsers.filter(u => u.role === 'admin');

      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          type: 'system',
          title: 'Support Chat Escalation',
          message: `A user${user ? ` (${user.full_name || user.email})` : ' (guest)'} needs admin assistance in the support chat.${sessionId ? ` Session: ${sessionId}` : ''}`,
          link: '/Messages',
          is_read: false,
          action_type: 'requested_changes'
        });
      }

      return Response.json({ escalated: true, message: "An admin has been notified and will join shortly. You can also reach us via Messages." });
    }

    // Build prompt with full session history + user context
    const systemPrompt = `${APP_CONTEXT}\n\nUSER CONTEXT:\n${userContext}`;
    const conversationLines = [
      `system: ${systemPrompt}`,
      ...history.map(h => `${h.role}: ${h.content}`),
      `user: ${message}`
    ].join('\n');

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${conversationLines}\n\nRespond as the support assistant. Follow all rules strictly. Use the user context to personalise your response where helpful.`,
    });

    return Response.json({ reply: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});