import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me().catch((e) => e.status === 401 ? null : Promise.reject(e));
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const { vendorId, reviewId } = await req.json().catch(() => ({}));
        if (typeof vendorId !== 'string' || !vendorId.trim()) return Response.json({ error: 'Vendor ID required' }, { status: 400 });
        const vendor = await base44.asServiceRole.entities.Vendor.get(vendorId).catch((e) => e.status === 404 ? null : Promise.reject(e));
        if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });
        if (user.role !== 'admin' && vendor.user_id !== user.id && vendor.created_by_id !== user.id) {
            if (typeof reviewId !== 'string' || !reviewId) return Response.json({ error: 'Forbidden' }, { status: 403 });
            const review = await base44.asServiceRole.entities.Review.get(reviewId).catch((e) => e.status === 404 ? null : Promise.reject(e));
            if (!review || review.vendor_id !== vendorId || review.created_by_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        let count = 0;
        let total = 0;
        let cursor;
        do {
            const page = await base44.asServiceRole.entities.Review.filter({ vendor_id: vendorId }, { limit: 100, ...(cursor ? { cursor } : {}) });
            for (const review of page.items) {
                if (typeof review.rating !== 'number' || !Number.isFinite(review.rating) || review.rating < 1 || review.rating > 5) {
                    return Response.json({ error: 'A review has an invalid rating' }, { status: 422 });
                }
                total += review.rating;
                count++;
            }
            cursor = page.has_more ? page.next_cursor : null;
        } while (cursor);
        const rating = count ? Math.round((total / count) * 10) / 10 : 0;
        await base44.asServiceRole.entities.Vendor.update(vendorId, { rating });
        return Response.json({ success: true, rating, reviewCount: count });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}