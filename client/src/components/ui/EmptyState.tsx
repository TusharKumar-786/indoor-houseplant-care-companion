import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const PLANT_TIPS = [
  'Water when the top 2 inches of soil feel dry to the touch.',
  'Most indoor plants prefer bright indirect light near east-facing windows.',
  'Group plants together to naturally raise ambient humidity.',
  'Rotate pots a quarter turn weekly for symmetrical, balanced growth.',
  'Snake plants and ZZ plants thrive in low-light corners.',
  'Fertilize sparingly — indoor plants need feeding mainly in spring and summer.',
  'Check leaf undersides monthly for early pest detection.',
  'Repot root-bound plants in spring using well-draining potting mix.',
  'Crispy leaf tips signal low humidity — try a pebble tray with water.',
  'Dust broad leaves with a damp cloth to maximize light absorption.',
  'Allow succulent soil to dry completely between waterings.',
  'Prune yellowing leaves to redirect energy to healthy new growth.',
];

interface EmptyStateProps {
  image?: string;
  heading: string;
  subtext?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  showTips?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  image = '/images/plants/snake-plant.webp',
  heading,
  subtext,
  actionLabel,
  actionTo,
  onAction,
  showTips = true,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!showTips) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % PLANT_TIPS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [showTips]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto"
    >
      <motion.img
        src={image}
        alt=""
        aria-hidden="true"
        className="w-32 h-32 object-cover rounded-full mb-6 border-4 border-[#C9D8C5] shadow-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
      />
      <h3 className="text-xl font-serif font-bold text-[#1F3D2B] mb-2">{heading}</h3>
      {subtext && (
        <p className="text-sm text-[#736159] mb-6 leading-relaxed">{subtext}</p>
      )}

      {showTips && (
        <div className="w-full mb-6 min-h-[52px]">
          <p className="text-[11px] font-semibold text-[#736159] mb-1.5 uppercase tracking-wider">
            Today's care tip
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-xs text-[#3B2F2A] italic leading-relaxed px-4 py-2.5 bg-[#E4EDB8]/40 rounded-xl border border-[#C9D8C5]/60"
            >
              {PLANT_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {actionLabel && (actionTo || onAction) && (
        actionTo ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3D2B] text-white text-sm font-semibold hover:bg-[#14291D] transition-colors shadow-sm"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F3D2B] text-white text-sm font-semibold hover:bg-[#14291D] transition-colors shadow-sm"
          >
            {actionLabel}
          </button>
        )
      )}
    </motion.div>
  );
};
