import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Edit3, Trash2 } from 'lucide-react';
import api from '../api/client';
import { BlogPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/blog/${slug}`)
      .then((res) => {
        if (isMounted && res.data?.data) {
          setPost(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) setPost(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      setIsDeleting(true);
      await api.delete(`/blog/${slug}`);
      showToast('Article deleted successfully');
      navigate('/blog');
    } catch (err) {
      showToast('Failed to delete article', 'error');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-72 w-full rounded-2xl" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-[#1F3D2B]">
          Article not found
        </h2>
        <p className="text-xs text-[#736159]">
          The story you are looking for may have been moved or removed.
        </p>
        <Link to="/blog">
          <Button variant="quiet" size="sm">
            Back to all stories
          </Button>
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.user_id;

  return (
    <article className="max-w-3xl mx-auto py-4 space-y-8 animate-in">
      {/* Back button and author action tools */}
      <div className="flex items-center justify-between">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736159] hover:text-[#1F3D2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link to={`/blog/${post.slug}/edit`}>
              <Button variant="quiet" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}>
                Edit
              </Button>
            </Link>
            <Button
              variant="quiet"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="text-[#C8693F] hover:bg-[#FBECE6]"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F3D2B] leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#736159] pb-4 border-b border-[#C9D8C5]">
          <span className="flex items-center gap-1.5 font-medium text-[#1F3D2B]">
            <User className="w-3.5 h-3.5 text-[#3E7B52]" />
            {post.author_name || 'Plant Caretaker'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.read_time || '4 min read'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Cover Image */}
      <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-[#ECE5D4] border border-[#C9D8C5] shadow-card">
        <img
          src={post.cover_image_url || '/images/plants/monstera.webp'}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Body Content with Editorial Typography */}
      <div className="prose prose-stone max-w-none text-[#3B2F2A] text-base leading-relaxed space-y-4 font-sans">
        {post.body.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Author Footer Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#C9D8C5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E4EDB8] text-[#1F3D2B] font-serif font-bold text-base flex items-center justify-center flex-shrink-0 border border-[#C9D8C5]">
            {(post.author_name || 'LP').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-[#3E7B52]">
              Written by
            </p>
            <p className="text-base font-serif font-bold text-[#1F3D2B] mt-0.5">
              {post.author_name || 'Plant Caretaker'}
            </p>
            <p className="text-xs text-[#736159] mt-0.5">
              Member of the LeafPulse botanical care community.
            </p>
          </div>
        </div>
        <Link to="/blog">
          <Button variant="quiet" size="sm">
            More Stories
          </Button>
        </Link>
      </div>

      {/* Conversion Banner: Care for plants like these? */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1F3D2B] text-[#F5F1E6] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="font-serif font-bold text-xl text-white">
            Care for plants like these?
          </h3>
          <p className="text-xs sm:text-sm text-[#C9D8C5] max-w-md">
            Track waterings, light exposure, and seasonal growth with LeafPulse. Free for all your indoor plants.
          </p>
        </div>
        <Link to={user ? '/dashboard' : '/register'} className="flex-shrink-0">
          <Button variant="accent" size="md">
            {user ? 'Go to My Garden' : 'Start Caring Today'}
          </Button>
        </Link>
      </div>
    </article>
  );
};
