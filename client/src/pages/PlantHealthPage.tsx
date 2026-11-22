import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Droplets,
  Sun,
  ShieldAlert,
  Sprout,
  HelpCircle,
  Camera,
  X,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { HealthCheckResult } from '../types';
import { Button } from '../components/ui/Button';

const COMMON_SYMPTOMS = [
  { id: 'yellow_leaves', label: 'Yellow Leaves', icon: Sprout },
  { id: 'brown_crispy_tips', label: 'Crispy Brown Tips', icon: Sun },
  { id: 'drooping', label: 'Limp Drooping Foliage', icon: Droplets },
  { id: 'pests', label: 'Insects or Webbing', icon: ShieldAlert },
  { id: 'mold_on_soil', label: 'White Mold on Soil', icon: AlertTriangle },
  { id: 'dry_soil', label: 'Bone Dry Potting Mix', icon: Droplets },
  { id: 'pale_leaves', label: 'Faded / Pale Leaf Color', icon: Sun },
  { id: 'leggy_stems', label: 'Elongated Stretched Stems', icon: Sprout },
];

export const PlantHealthPage: React.FC = () => {
  const { showToast } = useToast();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [plantNickname, setPlantNickname] = useState('');
  const [plantSpecies, setPlantSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      // Auto-suggest symptoms based on file name or default check
      const name = file.name.toLowerCase();
      if (name.includes('yellow') && !selectedSymptoms.includes('yellow_leaves')) {
        setSelectedSymptoms((prev) => [...prev, 'yellow_leaves']);
      } else if (name.includes('brown') && !selectedSymptoms.includes('brown_crispy_tips')) {
        setSelectedSymptoms((prev) => [...prev, 'brown_crispy_tips']);
      }
      showToast('Leaf photograph attached for diagnostic inspection');
    }
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      showToast('Please select at least one visual symptom', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/health-assistant', {
        symptoms: selectedSymptoms,
        plant_nickname: plantNickname.trim() || undefined,
        plant_species: plantSpecies.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setResult(res.data.data);
      showToast('Botanical diagnosis ready');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to analyze symptoms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setPlantNickname('');
    setPlantSpecies('');
    setNotes('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-in py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E4EDB8] text-[#1F3D2B] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Botanical Health Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            Plant Health Assistant
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
            Diagnose discoloration, limp stems, and pests using guided botanical rules
          </p>
        </div>

        {result && (
          <Button
            variant="quiet"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            New Health Check
          </Button>
        )}
      </div>

      {!result ? (
        /* Diagnosis Form */
        <form onSubmit={handleDiagnose} className="space-y-6">
          {/* Leaf Photo Upload (Optional) */}
          <div className="card p-6 bg-white border-[#C9D8C5] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
                  Optional: Attach Leaf Photo
                </h2>
                <p className="text-xs text-[#736159]">
                  Upload a clear, well-lit photo of the discolored leaf or stem
                </p>
              </div>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="text-xs font-semibold text-[#C8693F] hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {photoPreview ? (
              <div className="relative h-44 rounded-xl overflow-hidden border border-[#C9D8C5] bg-[#ECE5D4]">
                <img
                  src={photoPreview}
                  alt="Affected leaf preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#C9D8C5] hover:border-[#1F3D2B] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2 bg-[#F5F1E6]/40 hover:bg-[#F5F1E6] block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Camera className="w-6 h-6 text-[#3E7B52]" />
                <span className="text-xs font-semibold text-[#1F3D2B]">
                  Click to select foliage photo
                </span>
                <span className="text-[10px] text-[#736159]">
                  Supports JPG, PNG, WebP up to 5MB
                </span>
              </label>
            )}
          </div>

          {/* 1. Symptom Selector */}
          <div className="card p-6 bg-white border-[#C9D8C5] space-y-4">
            <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
              1. What visual symptoms do you observe?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMMON_SYMPTOMS.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedSymptoms.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSymptom(s.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-[#E4EDB8]/40 border-[#1F3D2B] shadow-xs'
                        : 'bg-[#F5F1E6]/50 hover:bg-[#F5F1E6] border-[#C9D8C5]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected ? 'text-[#1F3D2B]' : 'text-[#736159]'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#1F3D2B]' : 'text-[#3B2F2A]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Optional Context */}
          <div className="card p-6 bg-white border-[#C9D8C5] space-y-4">
            <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
              2. Plant details (Optional)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Plant Nickname
                </label>
                <input
                  type="text"
                  value={plantNickname}
                  onChange={(e) => setPlantNickname(e.target.value)}
                  placeholder="e.g. Balcony Fiddle Leaf"
                  className="input-botanical"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Species
                </label>
                <input
                  type="text"
                  value={plantSpecies}
                  onChange={(e) => setPlantSpecies(e.target.value)}
                  placeholder="e.g. Ficus lyrata"
                  className="input-botanical"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                Additional observations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Noticed leaves turning yellow after moving closer to the heater, soil felt wet..."
                className="input-botanical"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={<Sparkles className="w-4 h-4" />}
              iconPosition="right"
            >
              Analyze & Diagnose
            </Button>
          </div>
        </form>
      ) : (
        /* Diagnosis Results */
        <div className="space-y-6 animate-in">
          <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#C9D8C5]">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
                  Diagnosis Summary
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F3D2B] mt-1">
                  {result.diagnosis.issue}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E4EDB8] text-[#1F3D2B]">
                {result.diagnosis.confidence} Confidence
              </span>
            </div>

            <p className="text-sm text-[#3B2F2A] leading-relaxed">
              {result.diagnosis.explanation}
            </p>

            {/* Immediate Action Steps */}
            <div className="p-5 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5] space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
                Immediate Action Steps
              </h3>
              <ul className="space-y-2 text-xs text-[#3B2F2A]">
                {result.diagnosis.primary_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3E7B52] flex-shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preventive Measures */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
                Long-Term Prevention
              </h3>
              <ul className="space-y-1.5 text-xs text-[#736159] list-disc list-inside">
                {result.diagnosis.preventive_measures.map((prev, idx) => (
                  <li key={idx}>{prev}</li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-[#736159] italic pt-4 border-t border-[#C9D8C5]/50">
              {result.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
