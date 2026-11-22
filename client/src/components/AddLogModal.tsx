import React, { useState, useEffect } from 'react';
import { X, Droplets, Sparkles, Scissors, BookOpen } from 'lucide-react';
import api from '../api/client';
import { useToast } from './Toast';
import { Plant } from '../types';
import { localDateString } from '../utils/date';
import { Button } from './ui/Button';

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
  defaultPlantId?: number;
  preselectedPlantId?: number;
}

export const AddLogModal: React.FC<AddLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSaved,
  defaultPlantId,
  preselectedPlantId,
}) => {
  const { showToast } = useToast();
  const selectedDefault = preselectedPlantId || defaultPlantId;
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantId, setPlantId] = useState<number | string>(selectedDefault || '');
  const [action, setAction] = useState<'Watered' | 'Fertilized' | 'Pruned'>('Watered');
  const [date, setDate] = useState<string>(localDateString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/plants?limit=100').then((res) => {
        setPlants(res.data.data);
        if (!plantId && res.data.data.length > 0) {
          setPlantId(selectedDefault || res.data.data[0].id);
        }
      });
      if (selectedDefault) setPlantId(selectedDefault);
      setDate(localDateString());
      setNotes('');
      setError('');
    }
  }, [isOpen, selectedDefault]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantId) {
      setError('Please select a plant');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await api.post('/logs', {
        plant_id: Number(plantId),
        action,
        date,
        notes: notes.trim() || null,
      });

      showToast(`Logged "${action}" activity!`);
      window.dispatchEvent(new CustomEvent('leafpulse:care-logged'));
      if (onSuccess) onSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = [
    { key: 'Watered' as const, label: 'Watered', Icon: Droplets },
    { key: 'Fertilized' as const, label: 'Fertilized', Icon: Sparkles },
    { key: 'Pruned' as const, label: 'Pruned', Icon: Scissors },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#14291D]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden z-10 bg-white border border-[#C9D8C5] shadow-lifted animate-in">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#C9D8C5]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
              Record Care Activity
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#736159] hover:text-[#1F3D2B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
              {error}
            </div>
          )}

          {/* Plant Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Plant *
            </label>
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="input-botanical"
            >
              <option value="">— Choose Plant —</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname} ({p.species})
                </option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Care Action *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {actions.map(({ key, label, Icon }) => {
                const isActive = action === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAction(key)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[#1F3D2B] text-white shadow-xs'
                        : 'bg-[#F5F1E6] text-[#3B2F2A] border border-[#C9D8C5] hover:bg-[#ECE5D4]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-botanical"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Deep bottom watering, wiped leaf dust, checked roots"
              className="input-botanical resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <Button type="button" variant="quiet" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Log
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
