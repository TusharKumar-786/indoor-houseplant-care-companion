import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Droplets, Sun, Activity } from 'lucide-react';

interface PlantHealthScoreProps {
  score: number;
  breakdown?: {
    watering: number;
    light: number;
    activity: number;
  };
  size?: number;
  strokeWidth?: number;
}

export const PlantHealthScoreRing: React.FC<PlantHealthScoreProps> = ({
  score = 88,
  breakdown = { watering: 92, light: 85, activity: 88 },
  size = 140,
  strokeWidth = 10,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.max(0, Math.min(100, score));
    if (end === 0) {
      setAnimatedScore(0);
      return;
    }
    const duration = 400; // <400ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [score]);

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine botanical rating text
  const getRating = (val: number) => {
    if (val >= 90) return { label: 'Optimal Garden', color: '#1F3D2B' };
    if (val >= 75) return { label: 'Thriving Flora', color: '#3E7B52' };
    if (val >= 50) return { label: 'Moderate Care Needed', color: '#C8693F' };
    return { label: 'Attention Required', color: '#C8693F' };
  };

  const rating = getRating(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#C9D8C5"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            className="opacity-40"
          />
          {/* Animated progress circle stroke */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#1F3D2B"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>

        {/* Center score readout with animated counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-serif font-bold text-3xl text-[#1F3D2B] leading-none">
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#736159] mt-1">
            Health Index
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E4EDB8]/60 text-[#1F3D2B] border border-[#1F3D2B]/10">
          {rating.label}
        </span>
      </div>

      {/* Breakdown mini indicators */}
      {breakdown && (
        <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#C9D8C5]/60 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#736159]">
              <Droplets className="w-3 h-3 text-[#3E7B52]" />
              <span>Water</span>
            </div>
            <p className="font-serif font-bold text-xs text-[#1F3D2B]">{breakdown.watering}%</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#736159]">
              <Sun className="w-3 h-3 text-[#C8693F]" />
              <span>Light</span>
            </div>
            <p className="font-serif font-bold text-xs text-[#1F3D2B]">{breakdown.light}%</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#736159]">
              <Activity className="w-3 h-3 text-[#1F3D2B]" />
              <span>Care</span>
            </div>
            <p className="font-serif font-bold text-xs text-[#1F3D2B]">{breakdown.activity}%</p>
          </div>
        </div>
      )}
    </div>
  );
};
