import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Sun,
  ShieldCheck,
  CalendarDays,
  Camera,
  Layers,
  ArrowRight,
  ChevronDown,
  Check,
  Send,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import api from '../api/client';
import { BlogPost } from '../types';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real blog posts if available
  useEffect(() => {
    let isMounted = true;
    api
      .get('/blog')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setRecentPosts(res.data.data.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback demo posts if DB is empty
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      setContactError('Please complete all fields before sending.');
      return;
    }
    try {
      setContactSending(true);
      setContactError('');
      await api.post('/contact', {
        name: contactName,
        email: contactEmail,
        message: contactMsg,
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    } catch (err: any) {
      setContactError(
        err.response?.data?.message || 'Unable to deliver message right now.'
      );
    } finally {
      setContactSending(false);
    }
  };

  const photoStripPlants = [
    {
      name: 'Monstera Deliciosa',
      image: '/images/plants/monstera.webp',
      light: 'Bright indirect',
      water: 'Every 7-9 days',
      tip: 'Wipe leaves monthly with damp cotton to clear household dust.',
    },
    {
      name: 'Snake Plant',
      image: '/images/plants/snake-plant.webp',
      light: 'Any light level',
      water: 'Every 14-20 days',
      tip: 'Allow soil to dry bone-dry through the pot bottom between drinks.',
    },
    {
      name: 'Golden Pothos',
      image: '/images/plants/pothos.webp',
      light: 'Moderate to low',
      water: 'Every 6-8 days',
      tip: 'Prune trailing tips in spring to encourage dense foliage up top.',
    },
    {
      name: 'Fiddle Leaf Fig',
      image: '/images/plants/fiddle-leaf.webp',
      light: 'Filtered sunlight',
      water: 'Every 9-11 days',
      tip: 'Keep away from drafty doorways and air conditioning vents.',
    },
    {
      name: 'Peace Lily',
      image: '/images/plants/peace-lily.webp',
      light: 'Gentle shade',
      water: 'Every 5-7 days',
      tip: 'Foliage wilts softly when thirsty and perks back up within hours.',
    },
  ];

  const faqs = [
    {
      q: 'How does LeafPulse determine when my plants need water?',
      a: 'We calculate a personalized watering cycle based on species characteristics, container size, room window orientation, and ambient season. When you log a care event, the app projects the next date while reminding you to check topsoil moisture before pouring.',
    },
    {
      q: 'Do I need an active internet connection or paid subscription?',
      a: 'No. LeafPulse is completely free for individual gardeners. All your core schedules, room maps, and care logs operate seamlessly without paid tiers or locked features.',
    },
    {
      q: 'Can I upload photos to record my plant progression over time?',
      a: 'Yes. Each plant profile includes a Growth Journal where you can log height measurements, dates, notes, and visual progress photos to track how your collection develops over months.',
    },
    {
      q: 'What if I have plants that do not fit standard categories?',
      a: 'Every plant can have custom watering intervals, sunlight tolerance, and fertilizing frequencies assigned. You can tailor any care requirement to match your microclimate.',
    },
    {
      q: 'Is my botanical data and journal kept private?',
      a: 'Your collection is private to your account. We never sell personal data or display third-party advertisements.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#3B2F2A] selection:bg-[#E4EDB8] selection:text-[#1F3D2B]">
      {/* ─── 0. Navbar ──────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-[#F5F1E6]/95 backdrop-blur-md shadow-sm border-b border-[#C9D8C5]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo textColor="#1F3D2B" size={34} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3B2F2A]">
            <a href="#features" className="hover:text-[#1F3D2B] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#1F3D2B] transition-colors">
              How it Works
            </a>
            <Link to="/blog" className="hover:text-[#1F3D2B] transition-colors">
              Care Stories
            </Link>
            <a href="#contact" className="hover:text-[#1F3D2B] transition-colors">
              Contact
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="quiet" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Start for free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#1F3D2B] hover:bg-[#C9D8C5]/40 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14291D]/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative ml-auto w-72 h-full bg-[#F5F1E6] p-6 shadow-2xl flex flex-col justify-between z-10 border-l border-[#C9D8C5]"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#C9D8C5]">
                  <Logo textColor="#1F3D2B" size={30} />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-[#3B2F2A] hover:bg-[#C9D8C5]/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6 flex flex-col space-y-4 text-sm font-medium">
                  <a
                    href="#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#3B2F2A] hover:text-[#1F3D2B]"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#3B2F2A] hover:text-[#1F3D2B]"
                  >
                    How it Works
                  </a>
                  <Link
                    to="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#3B2F2A] hover:text-[#1F3D2B]"
                  >
                    Care Stories
                  </Link>
                  <a
                    href="#contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#3B2F2A] hover:text-[#1F3D2B]"
                  >
                    Contact
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-[#C9D8C5] space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="quiet" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="primary" className="w-full">
                    Start for free
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 1. Hero Section ────────────────────────────────────────── */}
      <section className="pt-8 sm:pt-16 pb-16 sm:pb-24 overflow-hidden relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/living-room.webp')` }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Editorial Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E4EDB8] text-[#1F3D2B]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Calm, honest houseplant care
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F3D2B] leading-[1.1] tracking-tight">
                Quiet guidance for your indoor garden.
              </h1>

              <p className="text-base sm:text-lg text-[#736159] max-w-xl leading-relaxed">
                LeafPulse helps you care for your houseplants with confidence—tracking watering cycles, room light exposures, and seasonal rhythms without clutter or guesswork.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Start for free
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="quiet" size="lg">
                    See how it works
                  </Button>
                </a>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-[#736159]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#3E7B52]" />
                  <span>No subscription</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#3E7B52]" />
                  <span>Rule-based precision</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#3E7B52]" />
                  <span>Zero ads or spam</span>
                </div>
              </div>
            </div>

            {/* Right Overlapping Photo Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
                {/* Main large photo: living room with plants */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-4/5 h-4/5 rounded-3xl overflow-hidden shadow-lifted border-4 border-white object-cover"
                >
                  <img
                    src="/images/plants/living-room.webp"
                    alt="Sunlit room with thriving houseplants"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </motion.div>

                {/* Secondary overlapping photo: monstera closeup */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  className="absolute bottom-4 right-0 w-3/5 h-1/2 rounded-2xl overflow-hidden shadow-lifted border-4 border-white"
                >
                  <img
                    src="/images/plants/monstera.webp"
                    alt="Glossy green Monstera leaf"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </motion.div>

                {/* Floating sample watering reminder badge card */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -top-3 right-4 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#C9D8C5] shadow-card flex items-center gap-3 z-20"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#FBECE6] text-[#C8693F] flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1F3D2B]">Due for a drink</p>
                    <p className="text-[11px] text-[#736159]">Monstera in Living Room</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Photo Strip ─────────────────────────────────────────── */}
      <section className="py-12 border-y border-[#C9D8C5]/70 bg-[#F5F1E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1F3D2B]">
              Common companions in our library
            </h2>
            <p className="text-xs text-[#736159] mt-1">
              Hover each specimen for seasonal care advice
            </p>
          </div>
          <span className="text-xs text-[#736159] font-medium hidden sm:block">
            Scroll horizontally to view more
          </span>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 px-4 sm:px-8 max-w-6xl mx-auto scrollbar-none">
          {photoStripPlants.map((plant) => (
            <div
              key={plant.name}
              className="flex-shrink-0 w-64 group bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1.5 cursor-pointer"
            >
              <div className="h-44 w-full overflow-hidden bg-[#ECE5D4]">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
                  {plant.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#736159]">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-[#3E7B52]" />
                    {plant.light}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#C9D8C5]/50">
                  <p className="text-[11px] text-[#736159] leading-relaxed">
                    {plant.tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
              Three simple steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
              Care built around your real home.
            </h2>
            <p className="text-sm text-[#736159] max-w-lg mx-auto">
              No complex sensor gadgets. Just clean tracking that pairs your windows and habits with what your plants crave.
            </p>
          </div>

          <div className="relative border-l-2 border-[#C9D8C5] ml-4 sm:ml-12 pl-6 sm:pl-10 space-y-12">
            {[
              {
                step: '01',
                title: 'Map your rooms and windows',
                desc: 'Add the rooms where your plants live. Specify whether windows face east morning sun, intense south light, or gentle northern shade so the app understands local microclimates.',
              },
              {
                step: '02',
                title: 'Add your plant collection',
                desc: 'Pick common houseplants from our library or configure custom species. Set watering cadence, sunlight tolerance, and attach reference photos to your visual journal.',
              },
              {
                step: '03',
                title: 'Log care with one simple tap',
                desc: 'When watering is due, confirm with a single click. LeafPulse recalculates future intervals dynamically based on season and warns you if light exposure seems mismatched.',
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                {/* Custom circular marker */}
                <div className="absolute -left-[35px] sm:-left-[51px] top-0 w-8 h-8 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center text-xs font-bold border-4 border-[#F5F1E6]">
                  {item.step}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#C9D8C5] shadow-soft transition-all group-hover:shadow-card">
                  <h3 className="font-serif font-bold text-xl text-[#1F3D2B] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#736159] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Features (Asymmetric layout) ────────────────────────── */}
      <section id="features" className="py-20 bg-white border-y border-[#C9D8C5]/70 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/leaf-texture.webp')` }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-20">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
              Thoughtful craftsmanship
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
              Every tool your collection needs
            </h2>
            <p className="text-sm text-[#736159]">
              Designed to eliminate guesswork, prevent root rot, and celebrate genuine growth milestones.
            </p>
          </div>

          {/* Feature 1: Room Orientation & Light matching */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#C9D8C5] shadow-card bg-[#ECE5D4]">
              <img
                src="/images/plants/living-room.webp"
                alt="Living room sunlight check"
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
            <div className="lg:col-span-6 space-y-4 lg:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B]">
                Window orientation matching
              </h3>
              <p className="text-sm text-[#736159] leading-relaxed">
                LeafPulse alerts you when a shade-loving fern is placed near a blazing south-facing pane, or when a hungry fiddle leaf fig is tucked in a dim north corner.
              </p>
            </div>
          </div>

          {/* Feature 2: Visual Growth Journal (Alternating side) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 space-y-4 lg:pr-6">
              <div className="w-10 h-10 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B]">
                Visual progression journals
              </h3>
              <p className="text-sm text-[#736159] leading-relaxed">
                Log height measurements, note when new leaves unfurl, and store progression photographs over months. Watching your plants mature is the greatest reward in gardening.
              </p>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 rounded-3xl overflow-hidden border border-[#C9D8C5] shadow-card bg-[#ECE5D4]">
              <img
                src="/images/plants/pothos.webp"
                alt="Pothos growth visual log"
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Feature 3: Smart Hydration & Seasonal Cadence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#C9D8C5] shadow-card bg-[#ECE5D4]">
              <img
                src="/images/plants/watering-hands.webp"
                alt="Gentle watering hands"
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
            <div className="lg:col-span-6 space-y-4 lg:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[#FBECE6] text-[#C8693F] flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B]">
                Seasonal hydration rhythm
              </h3>
              <p className="text-sm text-[#736159] leading-relaxed">
                Watering frequencies automatically adapt across seasons. When winter heating dries apartment air or summer sunlight speeds up evaporation, LeafPulse provides grounded advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Numbers ─────────────────────────────────────────────── */}
      <section className="py-16 bg-[#1F3D2B] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/monstera.webp')` }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="space-y-1 py-4 sm:py-0">
              <div className="font-serif font-bold text-4xl sm:text-5xl text-[#E4EDB8]">
                12,480+
              </div>
              <p className="text-xs uppercase tracking-wider text-[#C9D8C5]">
                Waterings Logged
              </p>
            </div>
            <div className="space-y-1 py-4 sm:py-0">
              <div className="font-serif font-bold text-4xl sm:text-5xl text-white">
                3,850+
              </div>
              <p className="text-xs uppercase tracking-wider text-[#C9D8C5]">
                Plants Thriving
              </p>
            </div>
            <div className="space-y-1 py-4 sm:py-0">
              <div className="font-serif font-bold text-4xl sm:text-5xl text-[#E4EDB8]">
                98.4%
              </div>
              <p className="text-xs uppercase tracking-wider text-[#C9D8C5]">
                Happy Plant Keepers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. Blog Preview ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
              Botanical Journal
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#1F3D2B] mt-1">
              Care stories from real owners
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-xs font-bold text-[#1F3D2B] hover:text-[#3E7B52] flex items-center gap-1 group"
          >
            <span>Read all articles</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(recentPosts.length > 0
            ? recentPosts
            : [
                {
                  id: 1,
                  title: 'How to Tell When Your Monstera Actually Needs Water',
                  slug: 'how-to-tell-when-monstera-needs-water',
                  cover_image_url: '/images/plants/monstera.webp',
                  author_name: 'Tushar Kumar',
                  read_time: '4 min read',
                  excerpt:
                    'Forget strict calendar reminders. Here is how reading leaf posture saves roots from rot.',
                },
                {
                  id: 2,
                  title: 'Understanding Window Directions in Modern Apartments',
                  slug: 'understanding-window-directions-apartments',
                  cover_image_url: '/images/plants/living-room.webp',
                  author_name: 'Elena Rostova',
                  read_time: '5 min read',
                  excerpt:
                    'A practical guide to matching your rooms natural light with plants that thrive in it.',
                },
                {
                  id: 3,
                  title: 'The Beginner Indoor Garden: Five Plants That Forgive',
                  slug: 'beginner-indoor-garden-five-forgiving-plants',
                  cover_image_url: '/images/plants/pothos.webp',
                  author_name: 'Marcus Bell',
                  read_time: '3 min read',
                  excerpt:
                    'If you have lost plants before, start with varieties engineered for resilient recovery.',
                },
              ]
          ).map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft hover:shadow-card transition-all duration-200 flex flex-col"
            >
              <div className="h-48 overflow-hidden bg-[#ECE5D4]">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-[#736159]">
                    <span>{post.read_time || '4 min read'}</span>
                    <span>•</span>
                    <span>By {post.author_name || 'Plant Caretaker'}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#1F3D2B] leading-snug group-hover:text-[#3E7B52] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#736159] line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <div className="text-xs font-semibold text-[#1F3D2B] flex items-center gap-1 group-hover:gap-2 transition-all">
                  <span>Read article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 7. Testimonials ────────────────────────────────────────── */}
      <section className="py-20 bg-[#ECE5D4]/60 border-y border-[#C9D8C5]/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
              Believed by real plant parents
            </h2>
            <p className="text-xs text-[#736159]">
              Everyday people keeping their apartments alive and green
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Before LeafPulse I kept drowning my fiddle leaf fig every Sunday out of habit. Learning to check by room light completely turned its yellow leaves around.',
                name: 'Kavita Sharma',
                city: 'Bengaluru',
                plants: '14 plants',
              },
              {
                quote:
                  'The window orientation check alone saved my Calathea collection from frying in my south balcony. Simple, calm, and no ridiculous push notifications.',
                name: 'Julian Vance',
                city: 'Edinburgh',
                plants: '22 plants',
              },
              {
                quote:
                  'As a student sharing a small flat, the beginner checklist made it so approachable to add my first Snake Plant and Pothos. It just works.',
                name: 'Priya Mehta',
                city: 'New Delhi',
                plants: '6 plants',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white p-6 rounded-2xl border border-[#C9D8C5] shadow-soft space-y-4"
              >
                <p className="text-sm text-[#3B2F2A] leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="pt-2 border-t border-[#C9D8C5]/40 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1F3D2B]">{t.name}</p>
                    <p className="text-[#736159]">{t.city}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E4EDB8] text-[#1F3D2B]">
                    {t.plants}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. FAQ Accordion ───────────────────────────────────────── */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-8 relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/succulent-shelf.webp')` }}
          aria-hidden="true"
        />
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-serif font-bold text-[#1F3D2B]">
            Frequently asked questions
          </h2>
          <p className="text-xs text-[#736159]">
            Everything you need to know about caring with LeafPulse
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              className="bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-serif font-semibold text-base text-[#1F3D2B] hover:bg-[#F5F1E6]/50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#736159] transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-[#1F3D2B]' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-sm text-[#736159] leading-relaxed border-t border-[#C9D8C5]/40">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 9. Contact Section ─────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-white border-t border-[#C9D8C5]/70 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/plant-shop.webp')` }}
          aria-hidden="true"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
                Get in touch
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#1F3D2B]">
                Have questions or botanical suggestions?
              </h2>
              <p className="text-sm text-[#736159] leading-relaxed">
                Whether you have an idea for a feature, need help setting up your apartment rooms, or want to contribute plant care stories, drop us a note.
              </p>
              <div className="pt-4 text-xs space-y-1">
                <p className="font-semibold text-[#1F3D2B]">Direct Email</p>
                <p className="text-[#736159]">support@leafpulse.local</p>
              </div>
            </div>

            <div className="md:col-span-7 bg-[#F5F1E6] p-6 sm:p-8 rounded-2xl border border-[#C9D8C5]">
              {contactSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E4EDB8] text-[#1F3D2B] mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#1F3D2B]">
                    Message received
                  </h3>
                  <p className="text-xs text-[#736159] max-w-xs mx-auto">
                    Thank you for reaching out. We read every inquiry and will respond to your email promptly.
                  </p>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => setContactSuccess(false)}
                    className="mt-2"
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
                      {contactError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Tushar Kumar"
                      className="input-botanical bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="input-botanical bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                      Message
                    </label>
                    <textarea
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      rows={4}
                      placeholder="Tell us about your houseplant collection..."
                      className="input-botanical bg-white"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={contactSending}
                    icon={<Send className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Send message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Footer ─────────────────────────────────────────────── */}
      <footer className="bg-[#1F3D2B] text-[#F5F1E6] py-12 border-t border-[#14291D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <Logo textColor="#F5F1E6" size={32} />
            <p className="text-xs text-[#C9D8C5] text-center sm:text-right max-w-sm">
              Handcrafted indoor plant care companion. Made with intention for thriving domestic gardens.
            </p>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#C9D8C5]/60">
            <p>© {new Date().getFullYear()} LeafPulse. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Register
              </Link>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
