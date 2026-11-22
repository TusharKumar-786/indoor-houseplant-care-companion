import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Sprout, X } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Room } from '../types';
import { Button } from '../components/ui/Button';

export const EditPlantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [nickname, setNickname] = useState('');
  const [species, setSpecies] = useState('');
  const [roomId, setRoomId] = useState<string>('');
  const [waterFrequency, setWaterFrequency] = useState<number | string>(7);
  const [sunlightLevel, setSunlightLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [fertilizingFrequency, setFertilizingFrequency] = useState<number | string>(14);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsRes, plantRes] = await Promise.all([
          api.get('/rooms'),
          api.get(`/plants/${id}`),
        ]);
        setRooms(roomsRes.data.data);

        const p = plantRes.data.data;
        setNickname(p.nickname);
        setSpecies(p.species);
        setRoomId(p.room_id ? p.room_id.toString() : '');
        setWaterFrequency(p.water_frequency_days);
        setSunlightLevel(p.sunlight_level);
        setFertilizingFrequency(p.fertilizing_frequency_days || 14);
        setExistingImageUrl(p.image_url);
      } catch (err) {
        showToast('Failed to load plant', 'error');
        navigate('/plants');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !species.trim()) {
      setError('Plant Nickname and Species are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await api.put(`/plants/${id}`, {
        nickname: nickname.trim(),
        species: species.trim(),
        room_id: roomId ? parseInt(roomId, 10) : null,
        water_frequency_days: Number(waterFrequency),
        sunlight_level: sunlightLevel,
        fertilizing_frequency_days: Number(fertilizingFrequency) || 14,
        image_url: existingImageUrl,
      });

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post(`/plants/${id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showToast('Plant updated successfully!');
      navigate(`/plants/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plant');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/plants/${id}`}
          className="p-2 -ml-1 rounded-xl text-[#736159] hover:text-[#1F3D2B] hover:bg-[#C9D8C5]/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B]">
            Edit {nickname}
          </h1>
          <p className="text-xs text-[#736159] mt-0.5">
            Update placement and care requirements
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5]">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-xs font-medium bg-[#FBECE6] text-[#C8693F] border border-[#C8693F]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Plant Nickname *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-botanical"
              required
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Species *
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="input-botanical"
              required
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Room Placement
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="input-botanical"
            >
              <option value="">No Room Assigned</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{' '}
                  {r.window_direction && r.window_direction !== 'None'
                    ? `(${r.window_direction} window)`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Care Requirements */}
          <div className="pt-4 space-y-4 border-t border-[#C9D8C5]/60">
            <h3 className="text-sm font-serif font-bold text-[#1F3D2B] flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#3E7B52]" />
              Care Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Water Frequency (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={waterFrequency}
                  onChange={(e) => setWaterFrequency(e.target.value)}
                  className="input-botanical"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Sunlight Level *
                </label>
                <select
                  value={sunlightLevel}
                  onChange={(e) => setSunlightLevel(e.target.value as any)}
                  className="input-botanical"
                >
                  <option value="Low">Low / Gentle Shade</option>
                  <option value="Medium">Medium Indirect</option>
                  <option value="High">High / Direct Sun</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Fertilizing (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={fertilizingFrequency}
                  onChange={(e) => setFertilizingFrequency(e.target.value)}
                  className="input-botanical"
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Plant Photograph
            </label>

            {imagePreview || existingImageUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#C9D8C5]">
                <img
                  src={imagePreview || existingImageUrl!}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#1F3D2B]/85 text-white text-xs font-semibold hover:bg-[#1F3D2B] transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#C9D8C5] hover:border-[#1F3D2B] rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-2 bg-[#F5F1E6]/50 hover:bg-[#F5F1E6]"
              >
                <Camera className="w-5 h-5 text-[#3E7B52]" />
                <p className="text-xs font-semibold text-[#1F3D2B]">
                  Upload new photo
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#C9D8C5]/60">
            <Button
              type="button"
              variant="quiet"
              onClick={() => navigate(`/plants/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
