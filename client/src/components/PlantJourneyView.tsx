import React, { useState } from 'react';
import { Calendar, TrendingUp, Sparkles, Image as ImageIcon } from 'lucide-react';
import { assetUrl } from '../utils/image';

interface JournalEntry {
  id: number;
  plant_id: number;
  height_cm?: number | null;
  notes?: string | null;
  image_url?: string | null;
  created_at: string;
}

interface PlantJourneyViewProps {
  entries: JournalEntry[];
  plantName: string;
}

export const PlantJourneyView: React.FC<PlantJourneyViewProps> = ({ entries = [], plantName }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  // Filter entries with height
  const heightEntries = entries
    .filter((e) => typeof e.height_cm === 'number' && e.height_cm! > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Filter entries with photos for before/after
  const photoEntries = entries
    .filter((e) => Boolean(e.image_url))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const earliestPhoto = photoEntries[0]?.image_url;
  const latestPhoto = photoEntries.length > 1 ? photoEntries[photoEntries.length - 1]?.image_url : null;

  // Simple SVG Line Chart generator
  const renderHeightChart = () => {
    if (heightEntries.length < 2) {
      return (
        <div className="py-8 text-center text-xs text-[#736159] bg-[#F5F1E6]/50 rounded-2xl border border-dashed border-[#C9D8C5]">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-[#3E7B52] opacity-60" />
          <p className="font-medium text-[#1F3D2B]">Log multiple heights to generate a growth curve</p>
          <p className="text-[11px] mt-0.5">Record current height in your Growth Journal to track progress.</p>
        </div>
      );
    }

    const width = 500;
    const height = 160;
    const padding = 35;

    const heights = heightEntries.map((e) => e.height_cm!);
    const minHeight = Math.max(0, Math.min(...heights) - 5);
    const maxHeight = Math.max(...heights) + 5;

    const points = heightEntries.map((e, index) => {
      const x = padding + (index / (heightEntries.length - 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((e.height_cm! - minHeight) / (maxHeight - minHeight || 1)) * (height - 2 * padding);
      return { x, y, date: new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }), val: e.height_cm };
    });

    const pathD = points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Subtle grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#C9D8C5"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#C9D8C5"
            strokeDasharray="4 4"
            strokeWidth="0.75"
          />

          {/* Area under curve fill */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="#E4EDB8"
            opacity="0.35"
          />

          {/* Main progression stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#1F3D2B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#C8693F" stroke="#F5F1E6" strokeWidth="2" />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#1F3D2B"
              >
                {pt.val} cm
              </text>
              <text
                x={pt.x}
                y={height - padding + 15}
                textAnchor="middle"
                fontSize="9"
                fill="#736159"
              >
                {pt.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Growth Progress Chart */}
      <div className="card p-6 bg-white border border-[#C9D8C5] shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
                Height Journey
              </h3>
              <p className="text-xs text-[#736159]">
                Vertical growth progress over recorded seasons
              </p>
            </div>
          </div>
          {heightEntries.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E4EDB8] text-[#1F3D2B]">
              Latest: {heightEntries[heightEntries.length - 1].height_cm} cm
            </span>
          )}
        </div>

        {renderHeightChart()}
      </div>

      {/* Before / After Photo Comparison */}
      {earliestPhoto && latestPhoto && earliestPhoto !== latestPhoto && (
        <div className="card p-6 bg-white border border-[#C9D8C5] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1F3D2B] text-[#E4EDB8] flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
                  Growth Comparison
                </h3>
                <p className="text-xs text-[#736159]">
                  Slide to compare arrival photo against latest photo
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#736159] flex items-center gap-3">
              <span>Arrival</span>
              <span>•</span>
              <span className="text-[#1F3D2B]">Latest</span>
            </div>
          </div>

          {/* Interactive Split Slider */}
          <div className="relative h-72 sm:h-84 rounded-2xl overflow-hidden select-none border border-[#C9D8C5] bg-[#ECE5D4]">
            {/* Latest (Underneath) */}
            <img
              src={assetUrl(latestPhoto)}
              alt="Latest foliage photo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 px-2 py-1 bg-[#1F3D2B]/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
              Today
            </div>

            {/* Earliest (Clipped on top) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={assetUrl(earliestPhoto)}
                alt="Arrival foliage photo"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: '100%', maxWidth: 'none' }}
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-[#C8693F]/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                Arrival
              </div>
            </div>

            {/* Slider Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-md"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#1F3D2B] border-2 border-[#1F3D2B] flex items-center justify-center text-[10px] font-bold shadow-md">
                ↔
              </div>
            </div>

            {/* Slider input handle */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              aria-label="Before after comparison slider"
            />
          </div>
        </div>
      )}
    </div>
  );
};
