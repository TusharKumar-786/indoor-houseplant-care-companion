import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  body: z.string().min(20, 'Post content must be at least 20 characters'),
  cover_image_url: z.string().optional().nullable(),
  excerpt: z.string().max(300).optional().nullable(),
  read_time: z.string().max(20).optional().nullable(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 180);
}

// GET /api/blog - Public list of blog posts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT b.id, b.user_id, u.name AS author_name, b.title, b.slug,
              COALESCE(b.cover_image_url, '/images/plants/monstera.webp') AS cover_image_url,
              b.read_time, b.excerpt, b.body, b.created_at
       FROM blog_posts b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/blog/:slug - Public single post by slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const result = await query(
      `SELECT b.id, b.user_id, u.name AS author_name, b.title, b.slug,
              COALESCE(b.cover_image_url, '/images/plants/monstera.webp') AS cover_image_url,
              b.read_time, b.excerpt, b.body, b.created_at
       FROM blog_posts b
       JOIN users u ON b.user_id = u.id
       WHERE b.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/blog - Authenticated: Create post
router.post('/', requireAuth, validateBody(blogSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, body, cover_image_url, excerpt, read_time } = req.body;

    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `post-${Date.now()}`;
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const words = body.trim().split(/\s+/).length;
    const computedReadTime = read_time || `${Math.max(1, Math.ceil(words / 180))} min read`;
    const computedExcerpt = excerpt || body.slice(0, 160).trim() + '...';

    const result = await query(
      `INSERT INTO blog_posts (user_id, title, slug, cover_image_url, read_time, excerpt, body)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, title, slug, cover_image_url, read_time, excerpt, body, created_at`,
      [userId, title.trim(), slug, cover_image_url || '/images/plants/monstera.webp', computedReadTime, computedExcerpt, body.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Article published successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/blog/:slug - Authenticated: Update post with ownership verification
router.put('/:slug', requireAuth, validateBody(blogSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { slug } = req.params;
    const { title, body, cover_image_url, excerpt, read_time } = req.body;

    const check = await query('SELECT id, user_id FROM blog_posts WHERE slug = $1', [slug]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (check.rows[0].user_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only edit your own articles' });
      return;
    }

    const words = body.trim().split(/\s+/).length;
    const computedReadTime = read_time || `${Math.max(1, Math.ceil(words / 180))} min read`;
    const computedExcerpt = excerpt || body.slice(0, 160).trim() + '...';

    const result = await query(
      `UPDATE blog_posts
       SET title = $1, body = $2, cover_image_url = COALESCE($3, cover_image_url),
           excerpt = $4, read_time = $5
       WHERE slug = $6
       RETURNING id, user_id, title, slug, cover_image_url, read_time, excerpt, body, created_at`,
      [title.trim(), body.trim(), cover_image_url, computedExcerpt, computedReadTime, slug]
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/blog/:slug - Authenticated: Delete post with ownership verification
router.delete('/:slug', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { slug } = req.params;

    const check = await query('SELECT id, user_id FROM blog_posts WHERE slug = $1', [slug]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (check.rows[0].user_id !== userId) {
      res.status(403).json({ success: false, message: 'You can only delete your own articles' });
      return;
    }

    await query('DELETE FROM blog_posts WHERE slug = $1', [slug]);

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
