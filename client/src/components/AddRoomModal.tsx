import React, { useState, useEffect } from 'react';
import { X, DoorClosed } from 'lucide-react';
import api from '../api/client';
import { useToast } from './Toast';
import { Room } from '../types';
import { Button } from './ui/Button';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
  editRoom?: Room | null;
  editingRoom?: Room | null;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSaved,
  editRoom,
  editingRoom,
}) => {
  const { showToast } = useToast();
  const currentEdit = editRoom || editingRoom || null;
  const [name, setName] = useState('');
  const [windowDirection, setWindowDirection] = useState('South');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentEdit) {
      setName(currentEdit.name);
      setWindowDirection(currentEdit.window_direction || 'None');
    } else {
      setName('');
      setWindowDirection('South');
    }
    setError('');
  }, [currentEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a room name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (currentEdit) {
        await api.put(`/rooms/${currentEdit.id}`, {
          name: name.trim(),
          window_direction: windowDirection,
        });
        showToast('Room updated successfully!');
      } else {
        await api.post('/rooms', {
          name: name.trim(),
          window_direction: windowDirection,
        });
        showToast('Room added to your apartment!');
      }

      if (onSuccess) onSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save room');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <DoorClosed className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
              {currentEdit ? 'Edit Room' : 'Add New Room'}
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

          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Room Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Living Room, Bedroom, South Balcony"
              className="input-botanical"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Primary Window Exposure
            </label>
            <select
              value={windowDirection}
              onChange={(e) => setWindowDirection(e.target.value)}
              className="input-botanical"
            >
              <option value="South">South (Intense midday / afternoon sun)</option>
              <option value="East">East (Gentle morning direct light)</option>
              <option value="West">West (Warm late afternoon rays)</option>
              <option value="North">North (Indirect uniform cool light)</option>
              <option value="None">No window / Artificial lighting only</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <Button type="button" variant="quiet" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {currentEdit ? 'Save Changes' : 'Add Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
