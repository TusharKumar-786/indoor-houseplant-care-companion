import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Camera, X, Sprout, Sparkles, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Room } from '../types';
import { Button } from '../components/ui/Button';

export const AddPlantPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [nickname, setNickname] = useState('');
  const [species, setSpecies] = useState('');
  const [roomId, setRoomId] = useState<string>('');
  const [waterFrequency, setWaterFrequency] = useState<number | string>(7);
  const [sunlightLevel, setSunlightLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [fertilizingFrequency, setFertilizingFrequency] = useState<number | string>(14);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState('');

  const identifyImage = async (file: File) => {
    try {
      setIsIdentifying(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/plants/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        const d = res.data.data;
        if (!nickname) setNickname(d.common_name);
        if (!species) setSpecies(d.species);
        if (d.water_frequency_days) setWaterFrequency(d.water_frequency_days);
        if (d.sunlight_level) setSunlightLevel(d.sunlight_level);
        showToast(`Identified as ${d.common_name} (${Math.round((d.confidence || 0.9) * 100)}% match)`);
      }
    } catch (err) {
      // Tolerate gracefully
    } finally {
      setIsIdentifying(false);
    }
  };

  // Pre-fill from query params (e.g. from recommended plants cards)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pNick = params.get('nickname');
    const pSpecies = params.get('species');
    const pWater = params.get('water');
    const pSunlight = params.get('sunlight');

    if (pNick) setNickname(pNick);
    if (pSpecies) setSpecies(pSpecies);
    if (pWater) setWaterFrequency(Number(pWater));
    if (pSunlight && ['Low', 'Medium', 'High'].includes(pSunlight)) {
      setSunlightLevel(pSunlight as any);
    }
  }, [location.search]);

  useEffect(() => {
    api.get('/rooms').then((res) => {
      setRooms(res.data.data);
      if (res.data.data.length > 0 && !roomId) {
        setRoomId(res.data.data[0].id.toString());
      }
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      identifyImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !species.trim()) {
      setError('Plant Nickname and Species are required');
      return;
    }
    if (!waterFrequency || Number(waterFrequency) < 1) {
      setError('Water frequency must be at least 1 day');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');

      const plantRes = await api.post('/plants', {
        nickname: nickname.trim(),
        species: species.trim(),
        room_id: roomId ? parseInt(roomId, 10) : null,
        water_frequency_days: Number(waterFrequency),
        sunlight_level: sunlightLevel,
        fertilizing_frequency_days: Number(fertilizingFrequency) || 14,
      });

      const newPlantId = plantRes.data.data.id;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post(`/plants/${newPlantId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showToast('Plant added to your garden!');
      navigate('/plants');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add plant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/plants"
          className="p-2 -ml-1 rounded-xl text-[#736159] hover:text-[#1F3D2B] hover:bg-[#C9D8C5]/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B]">
            Add New Plant
          </h1>
          <p className="text-xs text-[#736159] mt-0.5">
            Configure care intervals and room placement
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
              placeholder="e.g. Living Room Monstera, Bedroom Snake Plant"
              className="input-botanical"
              required
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Species / Botanical Name *
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. Monstera deliciosa, Sansevieria trifasciata"
              className="input-botanical"
              required
            />
          </div>

          {/* Room */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#1F3D2B]">
                Room Placement
              </label>
              <Link
                to="/rooms"
                className="text-xs font-semibold text-[#3E7B52] hover:underline"
              >
                + Manage Rooms
              </Link>
            </div>
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
                  Watering Frequency (days) *
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
                  <option value="High">High / Direct Sunlight</option>
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
                  placeholder="e.g. 14"
                  className="input-botanical"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
              Plant Photograph (Optional)
            </label>

            {imagePreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#C9D8C5]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {isIdentifying && (
                  <div className="absolute inset-0 bg-[#1F3D2B]/70 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#E4EDB8]" />
                    <span>Identifying species with botanical vision...</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-[#1F3D2B]/80 text-white hover:bg-[#1F3D2B] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#C9D8C5] hover:border-[#1F3D2B] rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-2 bg-[#F5F1E6]/50 hover:bg-[#F5F1E6]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1F3D2B]">
                    Click to upload photo
                  </p>
                  <p className="text-[11px] text-[#736159]">
                    PNG, JPG, or WEBP up to 5MB
                  </p>
                </div>
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
              onClick={() => navigate('/plants')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Plant
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
