import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        return Response.json({ 
            message: "Hello from the backend!",
            user: user ? user.email : "Anonymous",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});