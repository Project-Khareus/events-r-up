import { createClientFromRequest } from 'npm:@base44/sdk@0.8.47';
import { emailTemplate, button, escapeHtml, firstAdminEmail, SITE_URL } from '../../shared/emailLayout.js';

export default async function (req: Request): Promise<Response> {
  try {
    const { postId, isUpdate } = await req.json();
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const post = await base44.asServiceRole.entities.BlogPost.get(postId);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
    if (post.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminEmail = await firstAdminEmail(base44);
    if (!adminEmail) return Response.json({ success: true, emailSent: false });

    const author = escapeHtml(user.full_name || user.email);
    const title = escapeHtml(post.title);

    const content = `
      <p>${author} has ${isUpdate ? 'updated and resubmitted' : 'submitted'} the blog post
      <strong>"${title}"</strong> for approval.</p>
      ${button('Review Post', `${SITE_URL}/AdminBlog`)}
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      from_name: 'Khareus',
      subject: isUpdate ? 'Blog Post Submission Updated' : 'New Blog Post Submission',
      body: emailTemplate('Blog Post Awaiting Review', '#4F46E5', content)
    });

    return Response.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('notifyBlogSubmission failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}