import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';

export const WriteBlogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isEditing = Boolean(slug);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('/images/plants/monstera.webp');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [readTime, setReadTime] = useState('4 min read');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && slug) {
      api
        .get(`/blog/${slug}`)
        .then((res) => {
          const p = res.data.data;
          setTitle(p.title);
          setCoverImageUrl(p.cover_image_url || '/images/plants/monstera.webp');
          setExcerpt(p.excerpt || '');
          setBody(p.body);
          setReadTime(p.read_time || '4 min read');
        })
        .catch(() => {
          showToast('Failed to load article for editing', 'error');
          navigate('/blog');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEditing, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Please provide both an article title and content body.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const payload = {
        title: title.trim(),
        body: body.trim(),
        cover_image_url: coverImageUrl,
        excerpt: excerpt.trim(),
        read_time: readTime,
      };

      if (isEditing && slug) {
        await api.put(`/blog/${slug}`, payload);
        showToast('Article updated successfully!');
        navigate(`/blog/${slug}`);
      } else {
        const res = await api.post('/blog', payload);
        showToast('Article published successfully!');
        navigate(`/blog/${res.data.data.slug}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCovers = [
    { label: 'Monstera Leaf', path: '/images/plants/monstera.webp' },
    { label: 'Sunlit Living Room', path: '/images/plants/living-room.webp' },
    { label: 'Golden Pothos', path: '/images/plants/pothos.webp' },
    { label: 'Watering Hands', path: '/images/plants/watering-hands.webp' },
    { label: 'Plant Shop', path: '/images/plants/plant-shop.webp' },
    { label: 'Leaf Texture', path: '/images/plants/leaf-texture.webp' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in py-2">
      <div className="flex items-center justify-between pb-4 border-b border-[#C9D8C5]">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736159] hover:text-[#1F3D2B]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>
        <h1 className="font-serif font-bold text-lg text-[#1F3D2B]">
          {isEditing ? 'Edit Article' : 'Write an Article'}
        </h1>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-[#C9D8C5] shadow-soft">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
            Article Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to Save an Overwatered Peace Lily"
            className="input-botanical font-serif text-base"
            required
          />
        </div>

        {/* Cover Photo Choice */}
        <div>
          <label className="block text-xs font-semibold text-[#1F3D2B] mb-2">
            Select Cover Image
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {sampleCovers.map((cover) => (
              <button
                type="button"
                key={cover.path}
                onClick={() => setCoverImageUrl(cover.path)}
                className={`relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all ${
                  coverImageUrl === cover.path
                    ? 'border-[#1F3D2B] shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={cover.path}
                  alt={cover.label}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Short Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
            Short Summary / Excerpt
          </label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="One honest sentence previewing what the reader will learn."
            className="input-botanical text-xs"
          />
        </div>

        {/* Read Time */}
        <div className="w-48">
          <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
            Estimated Read Time
          </label>
          <input
            type="text"
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
            placeholder="e.g. 4 min read"
            className="input-botanical text-xs"
          />
        </div>

        {/* Body Text */}
        <div>
          <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
            Article Content
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder="Write your plant care guide here. Share your real observations, mistake stories, and recovery tips..."
            className="input-botanical text-sm leading-relaxed"
            required
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            iconPosition="right"
          >
            {isEditing ? 'Save Changes' : 'Publish Article'}
          </Button>
        </div>
      </form>
    </div>
  );
};
