import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ArrowRight, BookOpen, Clock, User } from 'lucide-react';
import api from '../api/client';
import { BlogPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const BlogPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/blog')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setPosts(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C9D8C5]">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
            Botanical Notes
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] mt-1">
            Plant Care Stories & Practical Guides
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-1 max-w-xl leading-relaxed">
            Honest advice written by houseplant caretakers. Learn soil physics, lighting nuance, and pest remedies.
          </p>
        </div>

        {isAuthenticated && (
          <Link to="/blog/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Write an Article
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles by topic, plant name, or care tip..."
          className="input-botanical pl-10"
        />
      </div>

      {/* Post Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-4 space-y-3">
              <div className="skeleton h-44 w-full rounded-xl" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white">
          <BookOpen className="w-8 h-8 text-[#736159] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#1F3D2B]">
            No articles found
          </h3>
          <p className="text-xs text-[#736159] max-w-sm mx-auto">
            {search
              ? `No articles match "${search}". Try searching for monstera, light, or water.`
              : 'No articles have been published yet. Be the first to share a care story.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden bg-[#ECE5D4]">
                  <img
                    src={post.cover_image_url || '/images/plants/monstera.webp'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-[#736159]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.read_time || '4 min read'}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      By {post.author_name || 'Plant Caretaker'}
                    </span>
                  </div>
                  <h2 className="font-serif font-bold text-base text-[#1F3D2B] leading-snug group-hover:text-[#3E7B52] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-[#736159] line-clamp-3 leading-relaxed">
                    {post.excerpt || post.body.slice(0, 140) + '...'}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs font-semibold text-[#1F3D2B] group-hover:text-[#3E7B52]">
                <span>Read guide</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
