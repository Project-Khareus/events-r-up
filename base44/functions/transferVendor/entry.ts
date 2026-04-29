import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { vendor_id, new_owner_email } = await req.json();

    if (!vendor_id || !new_owner_email) {
      return Response.json({ error: 'vendor_id and new_owner_email are required' }, { status: 400 });
    }

    // Look up the new owner by email
    const users = await base44.asServiceRole.entities.User.filter({ email: new_owner_email });
    if (!users || users.length === 0) {
      return Response.json({ error: `No user found with email: ${new_owner_email}` });
    }

    const newOwner = users[0];

    // Update vendor ownership
    await base44.asServiceRole.entities.Vendor.update(vendor_id, {
      user_id: newOwner.id,
      created_by: newOwner.email,
    });

    return Response.json({ success: true, new_owner_id: newOwner.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});