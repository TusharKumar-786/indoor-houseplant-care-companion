import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Undo2, CheckCircle2, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './Toast';
import api from '../api/client';
import { localDateString } from '../utils/date';

interface QuickWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: {
    id: number;
    nickname: string;
    species: string;
  };
  onSuccess?: () => void;
}

export const QuickWaterModal: React.FC<QuickWaterModalProps> = ({
  isOpen,
  onClose,
  plant,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isWatering, setIsWatering] = useState(false);
  const [completedLogId, setCompletedLogId] = useState<number | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Clear interval on unmount to prevent ghost toasts
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleWater = async () => {
    try {
      setIsWatering(true);
      const res = await api.post('/logs', {
        plant_id: plant.id,
        action: 'Watered',
        date: localDateString(),
        notes: 'Watered via Quick Water',
      });

      const logId = res.data?.data?.id;
      setCompletedLogId(logId);

      // Start 5 second undo timer
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      let secondsLeft = 5;
      setUndoTimer(secondsLeft);

      intervalRef.current = window.setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setUndoTimer(null);
          showToast(`Watering recorded for ${plant.nickname}`);
          window.dispatchEvent(new CustomEvent('leafpulse:care-logged'));
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setUndoTimer(secondsLeft);
        }
      }, 1000);
    } catch (err) {
      showToast('Failed to record watering', 'error');
      setIsWatering(false);
    }
  };

  const handleUndo = async () => {
    // Clear interval immediately on undo
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (completedLogId) {
      try {
        await api.delete(`/logs/${completedLogId}`);
        showToast('Watering undone', 'info');
        window.dispatchEvent(new CustomEvent('leafpulse:care-logged'));
      } catch (err) {
        // tolerate
      }
    }
    setUndoTimer(null);
    setCompletedLogId(null);
    setIsWatering(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!undoTimer) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-2 text-[#1F3D2B]">
          <Droplets className="w-5 h-5 text-[#3E7B52]" />
          <span>Quick Water</span>
        </div>
      }
      description={`Record hydration for ${plant.nickname}`}
      maxWidth="sm"
      showCloseButton={!undoTimer}
    >
      <div className="space-y-6 text-center py-2">
        {undoTimer !== null ? (
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-8 h-8 text-[#1F3D2B]" />
            </motion.div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#1F3D2B]">
                Watering Recorded
              </h3>
              <p className="text-xs text-[#736159] mt-1">
                Undo window active for <strong className="text-[#1F3D2B]">{undoTimer}s</strong>
              </p>
            </div>

            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handleUndo}
              className="w-full text-[#C8693F] border border-[#C8693F]/30 hover:bg-[#FBECE6]"
              icon={<Undo2 className="w-4 h-4" />}
            >
              Undo Watering ({undoTimer}s)
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="relative w-20 h-20 mx-auto rounded-full bg-[#F5F1E6] border-2 border-[#3E7B52]/20 flex items-center justify-center overflow-hidden">
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: [20, -5, 20] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-10 h-10 text-[#3E7B52]"
              >
                <Droplets className="w-full h-full fill-[#3E7B52]/20" />
              </motion.div>
            </div>

            <p className="text-xs sm:text-sm text-[#736159] leading-relaxed max-w-xs mx-auto">
              Confirm watering for <strong className="text-[#1F3D2B]">{plant.nickname}</strong>. This updates your care schedule and log book.
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="quiet"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                isLoading={isWatering}
                onClick={handleWater}
                icon={<Droplets className="w-4 h-4" />}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
