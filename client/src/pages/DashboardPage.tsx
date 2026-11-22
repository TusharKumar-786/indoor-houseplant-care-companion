import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sprout,
  CalendarDays,
  DoorClosed,
  Plus,
  ChevronRight,
  Droplets,
  AlertTriangle,
  Lightbulb,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Printer,
  HeartPulse,
  Compass,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { DashboardData, SmartSuggestion } from '../types';
import { AddRoomModal } from '../components/AddRoomModal';
import { Button } from '../components/ui/Button';
import { PlantHealthScoreRing } from '../components/PlantHealthScoreRing';
import { assetUrl } from '../utils/image';
import { WeatherTipCard } from '../components/WeatherTipCard';
import { QuickWaterModal } from '../components/QuickWaterModal';

// ── Daily plant care tips (rotate by day of year) ───────────────────────────
const CARE_TIPS = [
  'Water plants early in the day so foliage has ample light and air circulation to dry.',
  'Dust broad leaves gently with a damp cotton cloth to maximize light absorption.',
  'Yellowing leaves often indicate overwatering. Feel 2 inches into the soil before pouring.',
  'Most indoor tropicals thrive between 18–24°C (65–75°F). Keep clear of heat registers.',
  'Repot root-bound plants in spring using loose, well-draining aerated potting mix.',
  'Group plants together to naturally raise ambient humidity around delicate foliage.',
  'Fertilize sparingly—indoor plants need feeding primarily during spring and summer.',
  'Rotate pots a quarter turn each week to encourage symmetrical branch growth.',
  'Crispy leaf tips usually signal low humidity. Try grouping plants near a pebble tray.',
  'Prune yellowing leaves near the stem base to redirect energy into vigorous new shoots.',
  'Snake plants and ZZ plants tolerate deeper corners where direct sun rarely reaches.',
  'Allow succulent potting soil to dry completely through the pot between waterings.',
  'Always inspect the leaf undersides during your care routine for early pest detection.',
];

const getDailyTip = (): string => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return CARE_TIPS[dayOfYear % CARE_TIPS.length];
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = Math.max(0, value);
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const duration = 350;
    const interval = 20;
    const step = target / (duration / interval);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
};

// ── Beginner plant suggestions for zero-state onboarding ───────────────────
const BEGINNER_PLANTS = [
  {
    commonName: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    image: '/images/plants/snake-plant.webp',
    waterDays: 14,
    sunlight: 'Low' as const,
    tip: 'Stores water in thick vertical leaves. Survives dry indoor air easily.',
  },
  {
    commonName: 'Golden Pothos',
    species: 'Epipremnum aureum',
    image: '/images/plants/pothos.webp',
    waterDays: 7,
    sunlight: 'Medium' as const,
    tip: 'Fast-trailing vines that grow gracefully in moderate ambient light.',
  },
  {
    commonName: 'ZZ Plant',
    species: 'Zamioculcas zamiifolia',
    image: '/images/plants/zz-plant.webp',
    waterDays: 18,
    sunlight: 'Low' as const,
    tip: 'Thrives on gentle neglect with bulbous subterranean water rhizomes.',
  },
  {
    commonName: 'Peace Lily',
    species: 'Spathiphyllum wallisii',
    image: '/images/plants/peace-lily.webp',
    waterDays: 5,
    sunlight: 'Low' as const,
    tip: 'Signals thirst by softening slightly; perks upright quickly when watered.',
  },
  {
    commonName: 'Monstera Deliciosa',
    species: 'Monstera deliciosa',
    image: '/images/plants/monstera.webp',
    waterDays: 7,
    sunlight: 'High' as const,
    tip: 'Iconic split leaves that love bright, diffused morning illumination.',
  },
];

// ── SVG Weekly Bar Chart ─────────────────────────────────────────────────────
const WeeklyChart: React.FC<{ data: { day: string; count: number }[] }> = ({ data }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartH = 80;
  const barW = 28;
  const gap = 12;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="w-full overflow-x-auto py-2">
      <svg
        width={totalW}
        height={chartH + 36}
        viewBox={`0 0 ${totalW} ${chartH + 36}`}
        className="mx-auto block"
        style={{ minWidth: '100%' }}
        aria-label="Weekly watering care chart"
      >
        {data.map((d, i) => {
          const barH = Math.max(4, (d.count / maxCount) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isToday = i === data.length - 1;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={isToday ? '#1F3D2B' : '#C9D8C5'}
                opacity={isToday ? 1 : 0.75}
              />
              {d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="bold"
                  fill="#1F3D2B"
                >
                  {d.count}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={chartH + 18}
                textAnchor="middle"
                fontSize={10}
                fill={isToday ? '#1F3D2B' : '#736159'}
                fontWeight={isToday ? '700' : '500'}
              >
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [quickWaterPlant, setQuickWaterPlant] = useState<{ id: number; nickname: string; species: string } | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data.data);

      // Fetch smart suggestions and insights in parallel
      Promise.all([
        api.get('/suggestions').catch(() => ({ data: { data: [] } })),
        api.get('/insights').catch(() => ({ data: { data: null } })),
      ]).then(([sugRes, insRes]) => {
        if (sugRes.data?.data) setSuggestions(sugRes.data.data);
        if (insRes.data?.data) setInsights(insRes.data.data);
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenQuickWater = (plant: { id: number; nickname: string; species?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickWaterPlant({
      id: plant.id,
      nickname: plant.nickname,
      species: plant.species || 'Indoor Plant',
    });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Gardener';
  const dailyTip = getDailyTip();

  const isFirstTimeUser = data && data.counts.total_plants === 0;

  // Onboarding progress calculation
  const hasRoom = data ? data.counts.total_rooms > 0 : false;
  const hasPlant = data ? data.counts.total_plants > 0 : false;
  const hasLog = data
    ? data.weekly_activity.reduce((acc, curr) => acc + curr.count, 0) > 0
    : false;

  const completedSteps = (hasRoom ? 1 : 0) + (hasPlant ? 1 : 0) + (hasLog ? 1 : 0);

  // Skeleton Card
  const StatSkeleton = () => (
    <div className="card p-5 flex items-center justify-between">
      <div className="space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-8 w-12" />
      </div>
      <div className="skeleton w-11 h-11 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in">
      {/* ── Hero Header Banner with Botanical Photo & Overlay ─────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1F3D2B] text-white p-6 sm:p-8 shadow-card border border-[#1F3D2B]/20">
        {/* Background photo with darkened Deep Moss #1F3D2B overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/living-room.webp')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1F3D2B] via-[#1F3D2B]/90 to-[#1F3D2B]/60 pointer-events-none" />

        {/* Soft decorative leaf photograph on desktop right side */}
        <div
          className="hidden lg:block absolute right-0 top-0 bottom-0 w-80 bg-cover bg-left opacity-20 pointer-events-none"
          style={{ backgroundImage: `url('/images/plants/leaf-texture.webp')` }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#E4EDB8] text-[#1F3D2B]">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              {insights && (
                <span className="text-xs font-medium text-[#C9D8C5] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E4EDB8] inline-block animate-pulse" />
                  Health Index: {insights.score}%
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight drop-shadow-xs">
              {getTimeGreeting()}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D8C5] leading-relaxed drop-shadow-xs">
              {isFirstTimeUser
                ? 'Welcome to your care space. Follow the steps below to begin your garden log.'
                : 'Here is your indoor garden rhythm and care status for today.'}
            </p>
          </div>

          {/* Quick actions top bar inside banner with crisp contrast */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/report"
              className="p-2 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs"
              title="View garden care report"
            >
              <FileText className="w-3.5 h-3.5 text-[#E4EDB8]" />
              <span className="hidden sm:inline">Report</span>
            </Link>
            <Link
              to="/calendar"
              className="p-2 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs"
              title="Open care calendar"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#E4EDB8]" />
              <span className="hidden sm:inline">Calendar</span>
            </Link>
            <button
              onClick={() => setIsAddRoomOpen(true)}
              className="p-2 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs"
            >
              <DoorClosed className="w-3.5 h-3.5 text-[#E4EDB8]" />
              <span>Add Room</span>
            </button>
            <Link to="/add-plant">
              <Button
                variant="accent"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                className="bg-[#E4EDB8] text-[#1F3D2B] hover:bg-[#d5e09f] font-bold"
              >
                Add Plant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── State A: First-Time User Guided Onboarding (0 plants) ─── */}
      {isFirstTimeUser ? (
        <div className="space-y-8">
          {/* 1. Getting Started Checklist Card */}
          <div className="card p-6 sm:p-8 bg-white border border-[#C9D8C5] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#C9D8C5]/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
                  Garden Setup
                </span>
                <h2 className="text-xl font-serif font-bold text-[#1F3D2B] mt-0.5">
                  Three simple steps to start
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1F3D2B]">
                  {completedSteps} of 3 completed
                </span>
                <div className="w-24 h-2 rounded-full bg-[#F5F1E6] overflow-hidden border border-[#C9D8C5]">
                  <div
                    className="h-full bg-[#1F3D2B] transition-all duration-300"
                    style={{ width: `${(completedSteps / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Add a room */}
              <div
                onClick={() => !hasRoom && setIsAddRoomOpen(true)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  hasRoom
                    ? 'bg-[#E4EDB8]/30 border-[#C9D8C5]'
                    : 'bg-[#F5F1E6] hover:bg-[#ECE5D4] border-[#C9D8C5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F3D2B]">Step 1</span>
                  {hasRoom ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#736159]" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1F3D2B] mb-1">
                  Add your first room
                </h3>
                <p className="text-xs text-[#736159] leading-relaxed">
                  Map where your plants live and record window exposures.
                </p>
              </div>

              {/* Step 2: Add your first plant */}
              <Link
                to="/add-plant"
                className={`p-4 rounded-xl border transition-all block ${
                  hasPlant
                    ? 'bg-[#E4EDB8]/30 border-[#C9D8C5]'
                    : 'bg-[#F5F1E6] hover:bg-[#ECE5D4] border-[#C9D8C5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F3D2B]">Step 2</span>
                  {hasPlant ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#736159]" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1F3D2B] mb-1">
                  Add your first plant
                </h3>
                <p className="text-xs text-[#736159] leading-relaxed">
                  Choose from beginner recommendations below or add custom.
                </p>
              </Link>

              {/* Step 3: Log first care event */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  hasLog
                    ? 'bg-[#E4EDB8]/30 border-[#C9D8C5]'
                    : 'bg-[#F5F1E6] border-[#C9D8C5] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F3D2B]">Step 3</span>
                  {hasLog ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#736159]" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1F3D2B] mb-1">
                  Log your first care
                </h3>
                <p className="text-xs text-[#736159] leading-relaxed">
                  Once your plant is saved, record a quick watering with one tap.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Suggested Plants Gallery for Beginners */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1F3D2B]">
                  Recommended starter houseplants
                </h2>
                <p className="text-xs text-[#736159]">
                  Resilient, forgiving specimens that adapt gracefully to apartment conditions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BEGINNER_PLANTS.map((plant) => (
                <div
                  key={plant.commonName}
                  className="card overflow-hidden bg-white hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div className="h-44 overflow-hidden bg-[#ECE5D4]">
                    <img
                      src={plant.image}
                      alt={plant.commonName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
                          {plant.commonName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E4EDB8] text-[#1F3D2B]">
                          Every {plant.waterDays}d
                        </span>
                      </div>
                      <p className="text-xs italic text-[#736159]">
                        {plant.species}
                      </p>
                      <p className="text-xs text-[#736159] leading-relaxed pt-1">
                        {plant.tip}
                      </p>
                    </div>

                    <Link
                      to={`/add-plant?nickname=${encodeURIComponent(
                        plant.commonName
                      )}&species=${encodeURIComponent(
                        plant.species
                      )}&water=${plant.waterDays}&sunlight=${plant.sunlight}`}
                      className="block w-full"
                    >
                      <Button variant="quiet" size="sm" className="w-full">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to my collection</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Plant of the Day Card */}
          <div className="card p-6 bg-white border border-[#C9D8C5] flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#ECE5D4] flex-shrink-0 border border-[#C9D8C5]">
              <img
                src="/images/plants/monstera.webp"
                alt="Monstera Deliciosa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3E7B52]">
                Plant of the Day
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1F3D2B]">
                Monstera Deliciosa (Swiss Cheese Plant)
              </h3>
              <p className="text-xs text-[#736159] leading-relaxed">
                Native to Mexican rainforests, the iconic leaf fenestrations (holes) naturally evolve to allow heavy wind and rain to pass through canopy foliage without tearing.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ─── State B: Returning User With Existing Plants ─────────── */
        <div className="space-y-8">
          {/* Stat Cards with Staggered Entrance & Counter Animation */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
            >
              {/* Total Plants */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                }}
              >
                <Link
                  to="/plants"
                  className="card p-5 flex items-center justify-between hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group bg-white border-[#C9D8C5]"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
                      Total Plants
                    </span>
                    <div className="text-3xl font-serif font-bold text-[#1F3D2B] mt-1">
                      <AnimatedCounter value={data?.counts.total_plants ?? 0} />
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E4EDB8] text-[#1F3D2B] group-hover:scale-105 transition-transform">
                    <Sprout className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>

              {/* Due Today */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                }}
              >
                <Link
                  to="/schedule"
                  className="card p-5 flex items-center justify-between hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group bg-white border-[#C9D8C5]"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C8693F]">
                      Due for Water
                    </span>
                    <div className="text-3xl font-serif font-bold text-[#C8693F] mt-1">
                      <AnimatedCounter value={data?.counts.due_today ?? 0} />
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FBECE6] text-[#C8693F] group-hover:scale-105 transition-transform">
                    <Droplets className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>

              {/* Rooms */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                }}
              >
                <Link
                  to="/rooms"
                  className="card p-5 flex items-center justify-between hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group bg-white border-[#C9D8C5]"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#1F3D2B]">
                      Rooms Mapped
                    </span>
                    <div className="text-3xl font-serif font-bold text-[#1F3D2B] mt-1">
                      <AnimatedCounter value={data?.counts.total_rooms ?? 0} />
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#ECE5D4] text-[#1F3D2B] group-hover:scale-105 transition-transform">
                    <DoorClosed className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* Plant Health Index & Weather Microclimate Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 bg-white border border-[#C9D8C5] shadow-soft flex flex-col items-center justify-center">
              <PlantHealthScoreRing
                score={insights ? insights.score : 0}
                breakdown={insights?.breakdown}
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <WeatherTipCard />
              {/* Care Streak & Routine Banner */}
              <div className="card p-4 bg-white border border-[#C9D8C5] shadow-soft flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center font-bold text-sm">
                    {insights?.streak?.current ?? 0}d
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1F3D2B]">
                      Active Care Streak
                    </h4>
                    <p className="text-xs text-[#736159]">
                      {insights?.streak?.current ?? 0} consecutive days maintaining your plants' hydration.
                    </p>
                  </div>
                </div>
                <Link
                  to="/calendar"
                  className="text-xs font-semibold text-[#3E7B52] hover:underline flex items-center gap-1"
                >
                  <span>Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Smart Suggestions Panel */}
          {suggestions.length > 0 && (
            <div className="card p-5 sm:p-6 bg-white border border-[#C9D8C5] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#C9D8C5]/50">
                <Sparkles className="w-4 h-4 text-[#3E7B52]" />
                <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
                  Smart Botanical Suggestions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {suggestions.map((sug) => {
                  const isCritical = sug.severity === 'critical';
                  const isWarning = sug.severity === 'warning';

                  return (
                    <div
                      key={sug.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                        isCritical
                          ? 'bg-[#FBECE6]/60 border-[#C8693F]/30'
                          : isWarning
                          ? 'bg-[#FCFAF6] border-[#C9D8C5]'
                          : 'bg-[#F5F1E6]/70 border-[#C9D8C5]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isCritical ? (
                            <Droplets className="w-4 h-4 text-[#C8693F]" />
                          ) : isWarning ? (
                            <Compass className="w-4 h-4 text-[#3E7B52]" />
                          ) : (
                            <Lightbulb className="w-4 h-4 text-[#3E7B52]" />
                          )}
                          <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
                            {sug.title}
                          </h3>
                        </div>
                        <p className="text-xs text-[#736159] leading-relaxed">
                          {sug.description}
                        </p>
                      </div>

                      {sug.action_label && sug.action_path && (
                        <div className="pt-1">
                          <Link
                            to={sug.action_path}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3D2B] hover:text-[#3E7B52] transition-colors"
                          >
                            <span>{sug.action_label}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Two-Column: Due Today List + Weekly Care Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left 3 cols: Plants Due Today */}
            <div className="card overflow-hidden lg:col-span-3 bg-white border-[#C9D8C5]">
              <div className="px-5 py-4 flex items-center justify-between border-b border-[#C9D8C5]/60">
                <div className="flex items-center gap-2.5">
                  <Droplets className="w-4 h-4 text-[#C8693F]" />
                  <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
                    Ready for Hydration
                  </h2>
                  {data && data.plants_due_today.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FBECE6] text-[#C8693F]">
                      {data.plants_due_today.length}
                    </span>
                  )}
                </div>
                <Link
                  to="/schedule"
                  className="text-xs font-semibold text-[#3E7B52] hover:underline flex items-center gap-0.5"
                >
                  Schedule <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#C9D8C5]/50">
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-[#736159]">
                    Loading schedule...
                  </div>
                ) : !data || data.plants_due_today.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="font-serif font-semibold text-sm text-[#1F3D2B]">
                      All caught up for today
                    </p>
                    <p className="text-xs text-[#736159] max-w-xs">
                      No plants currently require water. Soil dampness levels are within their safe buffer.
                    </p>
                  </div>
                ) : (
                  data.plants_due_today.map((plant) => (
                    <div
                      key={plant.id}
                      onClick={() => navigate(`/plants/${plant.id}`)}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-[#F5F1E6]/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#ECE5D4] flex-shrink-0 border border-[#C9D8C5]">
                          <img
                            src={assetUrl(plant.image_url) || '/images/plants/monstera.webp'}
                            alt={plant.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#1F3D2B] truncate">
                            {plant.nickname}
                          </p>
                          <p className="text-xs text-[#736159] truncate">
                            {plant.species} {plant.room ? `• ${plant.room}` : ''}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="accent"
                        size="sm"
                        onClick={(e) => handleOpenQuickWater(plant, e)}
                        className="flex-shrink-0"
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        <span>Water</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right 2 cols: Weekly Activity & Daily Tip */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weekly Chart */}
              <div className="card p-5 bg-white border-[#C9D8C5]">
                <h2 className="font-serif font-bold text-sm text-[#1F3D2B] mb-3">
                  7-Day Care Activity
                </h2>
                {isLoading ? (
                  <div className="h-28 flex items-center justify-center text-xs text-[#736159]">
                    Loading activity...
                  </div>
                ) : (
                  <WeeklyChart data={data?.weekly_activity || []} />
                )}
              </div>

              {/* Daily Care Tip */}
              <div className="card p-5 bg-[#FCFAF6] border-[#C9D8C5] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3E7B52]">
                  <Lightbulb className="w-4 h-4" />
                  <span>Daily Care Note</span>
                </div>
                <p className="text-xs text-[#736159] leading-relaxed">
                  {dailyTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onSaved={fetchDashboard}
      />

      {/* Quick Water 5-Second Undo Modal */}
      {quickWaterPlant && (
        <QuickWaterModal
          isOpen={Boolean(quickWaterPlant)}
          onClose={() => setQuickWaterPlant(null)}
          plant={quickWaterPlant}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
};
