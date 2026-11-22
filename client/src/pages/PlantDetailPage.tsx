import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Droplets,
  Sun,
  Sparkles,
  Scissors,
  Calendar,
  DoorClosed,
  Plus,
  BookOpen,
  Ruler,
  QrCode,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Plant, GrowthJournalEntry } from '../types';
import { AddLogModal } from '../components/AddLogModal';
import { Button } from '../components/ui/Button';
import { PlantQRCodeModal } from '../components/PlantQRCodeModal';
import { PlantJourneyView } from '../components/PlantJourneyView';
import { localDateString } from '../utils/date';
import { assetUrl } from '../utils/image';

const PLACEHOLDER = '/images/plants/monstera.webp';

export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  // Growth Journal state
  const [journalEntries, setJournalEntries] = useState<GrowthJournalEntry[]>([]);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [journalDate, setJournalDate] = useState(localDateString());
  const [journalNotes, setJournalNotes] = useState('');
  const [journalHeight, setJournalHeight] = useState('');
  const [isJournalSubmitting, setIsJournalSubmitting] = useState(false);

  const fetchJournal = async () => {
    try {
      const res = await api.get(`/plants/${id}/journal`);
      setJournalEntries(res.data.data);
    } catch (err) {
      console.warn('Failed to fetch growth journal entries', err);
    }
  };

  const fetchPlant = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/plants/${id}`);
      setPlant(res.data.data);
      await fetchJournal();
    } catch (err) {
      showToast('Failed to load plant details', 'error');
      navigate('/plants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalNotes.trim()) return;
    try {
      setIsJournalSubmitting(true);
      await api.post(`/plants/${id}/journal`, {
        date: journalDate,
        notes: journalNotes.trim(),
        height_cm: journalHeight ? parseFloat(journalHeight) : null,
      });
      showToast('Journal milestone saved!');
      setJournalNotes('');
      setJournalHeight('');
      setIsAddingJournal(false);
      await fetchJournal();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save milestone', 'error');
    } finally {
      setIsJournalSubmitting(false);
    }
  };

  const handleDeleteJournalEntry = async (entryId: number) => {
    if (!window.confirm('Delete this journal milestone?')) return;
    try {
      await api.delete(`/plants/${id}/journal/${entryId}`);
      showToast('Milestone entry removed');
      await fetchJournal();
    } catch (err) {
      showToast('Failed to remove entry', 'error');
    }
  };

  useEffect(() => {
    fetchPlant();
  }, [id]);

  const handleQuickAction = async (action: 'Watered' | 'Fertilized' | 'Pruned') => {
    try {
      await api.post('/logs', {
        plant_id: Number(id),
        action,
        date: localDateString(),
        notes: `Quick logged ${action}`,
      });
      showToast(`Logged "${action}"!`);
      fetchPlant();
    } catch (err) {
      showToast('Failed to log action', 'error');
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete ${plant?.nickname}? This will also remove care history.`
      )
    )
      return;
    try {
      setIsDeleting(true);
      await api.delete(`/plants/${id}`);
      showToast('Plant deleted successfully');
      navigate('/plants');
    } catch (err) {
      showToast('Failed to delete plant', 'error');
      setIsDeleting(false);
    }
  };

  if (isLoading || !plant) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 animate-in py-8">
        <div className="skeleton h-6 w-32" />
        <div className="card p-6 flex gap-6 bg-white">
          <div className="skeleton w-40 h-40 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-7 w-48" />
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-in py-2">
      {/* Back button and page tools */}
      <div className="flex items-center justify-between">
        <Link
          to="/plants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736159] hover:text-[#1F3D2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plants</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setIsQROpen(true)}
            icon={<QrCode className="w-3.5 h-3.5" />}
          >
            QR Tag
          </Button>
          <Link to={`/plants/${id}/edit`}>
            <Button variant="quiet" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>
              Edit Plant
            </Button>
          </Link>
          <Button
            variant="quiet"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="text-[#C8693F] hover:bg-[#FBECE6]"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Plant Profile Hero Card */}
      <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5] flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
        {/* Plant Photo */}
        <div className="w-full md:w-52 h-52 rounded-2xl overflow-hidden bg-[#ECE5D4] border border-[#C9D8C5] flex-shrink-0 shadow-soft">
          <img
            src={assetUrl(plant.image_url) || PLACEHOLDER}
            alt={plant.nickname}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-3xl font-serif font-bold text-[#1F3D2B]">
                {plant.nickname}
              </h1>
              {plant.room && (
                <span className="badge-sage flex items-center gap-1">
                  <DoorClosed className="w-3 h-3" />
                  {plant.room}
                </span>
              )}
            </div>
            <p className="text-sm italic text-[#736159]">{plant.species}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="accent"
              size="sm"
              onClick={() => handleQuickAction('Watered')}
              icon={<Droplets className="w-3.5 h-3.5" />}
            >
              Water
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => handleQuickAction('Fertilized')}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Feed
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => handleQuickAction('Pruned')}
              icon={<Scissors className="w-3.5 h-3.5" />}
            >
              Prune
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setIsAddLogOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Custom Log
            </Button>
          </div>

          {/* Schedule Summary Banner */}
          <div className="p-4 rounded-xl bg-[#F5F1E6] border border-[#C9D8C5] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[#736159] block">Last Watered</span>
              <span className="font-semibold text-[#1F3D2B]">
                {plant.last_watered
                  ? new Date(plant.last_watered).toLocaleDateString()
                  : 'No logs yet'}
              </span>
            </div>
            <div>
              <span className="text-[#736159] block">Next Scheduled</span>
              <span
                className={`font-bold ${
                  plant.is_due ? 'text-[#C8693F]' : 'text-[#1F3D2B]'
                }`}
              >
                {plant.is_due ? 'Watering due today' : plant.next_watering_date}
              </span>
            </div>
            <div>
              <span className="text-[#736159] block">Cadence</span>
              <span className="font-semibold text-[#1F3D2B]">
                Every {plant.water_frequency_days} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Care Requirements Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-white border-[#C9D8C5] space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3E7B52]">
            <Droplets className="w-4 h-4" />
            <span>Hydration Cycle</span>
          </div>
          <p className="font-serif font-bold text-lg text-[#1F3D2B]">
            Every {plant.water_frequency_days} Days
          </p>
          <p className="text-xs text-[#736159]">
            Check topsoil dryness before watering
          </p>
        </div>

        <div className="card p-5 bg-white border-[#C9D8C5] space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3E7B52]">
            <Sun className="w-4 h-4" />
            <span>Light Requirement</span>
          </div>
          <p className="font-serif font-bold text-lg text-[#1F3D2B]">
            {plant.sunlight_level} Sunlight
          </p>
          <p className="text-xs text-[#736159]">
            {plant.sunlight_level === 'High'
              ? 'Bright diffused or direct morning rays'
              : plant.sunlight_level === 'Medium'
              ? 'Bright indirect illumination'
              : 'Soft shade or filtered light'}
          </p>
        </div>

        <div className="card p-5 bg-white border-[#C9D8C5] space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3E7B52]">
            <Sparkles className="w-4 h-4" />
            <span>Feeding Frequency</span>
          </div>
          <p className="font-serif font-bold text-lg text-[#1F3D2B]">
            Every {plant.fertilizing_frequency_days || 14} Days
          </p>
          <p className="text-xs text-[#736159]">
            Dilute fertilizer in active growth seasons
          </p>
        </div>
      </div>

      {/* Visual Height & Photo Comparison Journey */}
      <PlantJourneyView entries={journalEntries as any} plantName={plant.nickname} />

      {/* Growth Journal Section */}
      <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#C9D8C5]/60">
          <div>
            <h2 className="font-serif font-bold text-xl text-[#1F3D2B]">
              Growth Journal & Milestones
            </h2>
            <p className="text-xs text-[#736159] mt-0.5">
              Record new leaf growth, repotting, and height progressions
            </p>
          </div>
          {!isAddingJournal && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setIsAddingJournal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Milestone
            </Button>
          )}
        </div>

        {/* Add Milestone Form */}
        {isAddingJournal && (
          <form
            onSubmit={handleAddJournalEntry}
            className="p-5 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5] space-y-4 animate-in"
          >
            <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
              Record New Milestone
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="input-botanical bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                  Height (cm, optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={journalHeight}
                  onChange={(e) => setJournalHeight(e.target.value)}
                  placeholder="e.g. 35.5"
                  className="input-botanical bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3D2B] mb-1">
                Milestone Notes
              </label>
              <textarea
                value={journalNotes}
                onChange={(e) => setJournalNotes(e.target.value)}
                rows={3}
                placeholder="Observed new leaf unfurling, rotated pot, or wiped foliage..."
                className="input-botanical bg-white"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => setIsAddingJournal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isJournalSubmitting}
              >
                Save Milestone
              </Button>
            </div>
          </form>
        )}

        {/* Journal Entries List */}
        {journalEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#736159]">
            No growth milestones logged yet. Click "Add Milestone" to record leaf growth.
          </div>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-[#C9D8C5] bg-[#FCFAF6] flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-xs text-[#736159]">
                    <span className="font-semibold text-[#1F3D2B]">
                      {entry.date}
                    </span>
                    {entry.height_cm && (
                      <span className="flex items-center gap-1 font-medium text-[#3E7B52]">
                        <Ruler className="w-3.5 h-3.5" />
                        {entry.height_cm} cm tall
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#3B2F2A] leading-relaxed">
                    {entry.notes}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteJournalEntry(entry.id)}
                  className="p-1.5 rounded-lg text-[#736159] hover:text-[#C8693F] hover:bg-[#FBECE6] transition-colors"
                  title="Remove milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Care Log History Section */}
      <div className="card p-6 sm:p-8 bg-white border-[#C9D8C5] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#C9D8C5]/60">
          <h2 className="font-serif font-bold text-xl text-[#1F3D2B]">
            Recent Care Activity
          </h2>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setIsAddLogOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Log Care
          </Button>
        </div>

        {!plant.recent_logs || plant.recent_logs.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#736159]">
            No care actions recorded yet for this plant.
          </div>
        ) : (
          <div className="divide-y divide-[#C9D8C5]/50">
            {plant.recent_logs.map((log) => (
              <div
                key={log.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold ${
                      log.action === 'Watered'
                        ? 'bg-[#E4EDB8] text-[#1F3D2B]'
                        : log.action === 'Fertilized'
                        ? 'bg-[#FCFAF6] text-[#C8693F] border border-[#C8693F]/20'
                        : 'bg-[#ECE5D4] text-[#1F3D2B]'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-[#736159]">{log.notes || '—'}</span>
                </div>
                <span className="text-[#736159] font-medium">{log.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Log Modal */}
      <AddLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        onSaved={fetchPlant}
        preselectedPlantId={plant.id}
      />

      {/* QR Code Tag Modal */}
      <PlantQRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        plant={plant}
        onWatered={fetchPlant}
      />
    </div>
  );
};
