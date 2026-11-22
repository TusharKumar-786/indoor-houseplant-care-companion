import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'right' | 'left';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'md',
  position = 'right',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const widthClass = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[width];

  const slideVariants = {
    hidden: { x: position === 'right' ? '100%' : '-100%' },
    visible: { x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-[#14291D]/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideVariants}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative w-full ${widthClass} ${
              position === 'right' ? 'ml-auto' : 'mr-auto'
            } h-full bg-[#F5F1E6] border-${position === 'right' ? 'l' : 'r'} border-[#C9D8C5] shadow-lifted z-10 flex flex-col`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#C9D8C5] flex items-center justify-between bg-white/70">
              <div>
                {title && (
                  <h3 className="font-serif font-bold text-lg text-[#1F3D2B]">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[#736159] mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#736159] hover:text-[#1F3D2B] hover:bg-[#C9D8C5]/30 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
