import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Compass, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const WelcomeTourModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem('leafpulse_tour_completed');
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('leafpulse_tour_completed', 'true');
    setIsOpen(false);
  };

  const slides = [
    {
      icon: <Sprout className="w-8 h-8 text-[#3E7B52]" />,
      title: 'Welcome to LeafPulse',
      subtitle: 'Your Handcrafted Garden Companion',
      description:
        'LeafPulse tracks hydration intervals, sunlight exposures, and growth stories so every houseplant in your living space thrives naturally.',
      image: '/images/plants/monstera.webp',
    },
    {
      icon: <Compass className="w-8 h-8 text-[#1F3D2B]" />,
      title: 'Room Sunlight & Microclimates',
      subtitle: 'Orientation-Aware Placement',
      description:
        'Map your living rooms by window exposure—South, East, West, or North. LeafPulse calculates light intensity to protect foliage from scorched leaves or low-light leggy stems.',
      image: '/images/plants/living-room.webp',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-[#C8693F]" />,
      title: 'Ask Leafy & Botanical Diagnostics',
      subtitle: 'Real Horticultural Guidance',
      description:
        'Use Ask Leafy for personalized watering advice, scan plant QR tags for one-tap care, and diagnose yellowing leaves or pests in our Health Assistant.',
      image: '/images/plants/succulent-shelf.webp',
    },
  ];

  const slide = slides[currentSlide];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      showCloseButton={true}
    >
      <div className="space-y-6 text-center">
        {/* Slide Image Preview */}
        <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-[#ECE5D4] border border-[#C9D8C5]">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F3D2B]/80 via-[#1F3D2B]/20 to-transparent flex items-end p-5">
            <div className="text-left text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E4EDB8]">
                {slide.subtitle}
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl leading-tight">
                {slide.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Slide Description */}
        <p className="text-xs sm:text-sm text-[#736159] leading-relaxed max-w-md mx-auto">
          {slide.description}
        </p>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-[#1F3D2B]' : 'w-2 bg-[#C9D8C5]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="quiet" size="sm" onClick={handleClose}>
            Skip Tour
          </Button>

          {currentSlide < slides.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentSlide((prev) => prev + 1)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="accent"
              size="sm"
              onClick={handleClose}
              icon={<Check className="w-4 h-4" />}
              iconPosition="right"
            >
              Enter My Garden
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
