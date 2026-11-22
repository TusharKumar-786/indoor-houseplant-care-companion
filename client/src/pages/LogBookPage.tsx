import React, { useState, useEffect } from 'react';
import {
  Plus,
  Droplets,
  Sparkles,
  Scissors,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { CareLog, Plant } from '../types';
import { AddLogModal } from '../components/AddLogModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export const LogBookPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlants = async () => {
    try {
      const res = await api.get('/plants?limit=100');
      setPlants(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 10 };
      if (selectedPlantId) params.plant_id = selectedPlantId;
      const res = await api.get('/logs', { params });
      setLogs(res.data.data);
      if (res.data.meta) {
        setTotalPages(res.data.meta.totalPages || 1);
        setTotalLogs(res.data.meta.total || 0);
      }
    } catch (err) {
      showToast('Failed to load log book', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedPlantId]);

  const handleDelete = async (logId: number) => {
    if (!window.confirm('Delete this care log entry?')) return;
    try {
      await api.delete(`/logs/${logId}`);
      showToast('Care log removed');
      fetchLogs();
    } catch (err) {
      showToast('Failed to delete log entry', 'error');
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Watered':
        return (
          <span className="badge-lime flex items-center gap-1">
            <Droplets className="w-3 h-3 text-[#3E7B52]" />
            Watered
          </span>
        );
      case 'Fertilized':
        return (
          <span className="badge-terracotta flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C8693F]" />
            Fertilized
          </span>
        );
      case 'Pruned':
        return (
          <span className="badge-sage flex items-center gap-1">
            <Scissors className="w-3 h-3 text-[#1F3D2B]" />
            Pruned
          </span>
        );
      default:
        return <span className="badge-sage">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            Care Log Book
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
            Complete historical timeline of waterings, feedings, and prunings
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Add Log Entry
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="relative w-full sm:w-72">
        <select
          value={selectedPlantId}
          onChange={(e) => {
            setSelectedPlantId(e.target.value);
            setPage(1);
          }}
          className="input-botanical appearance-none pr-9 bg-white"
        >
          <option value="">All Plants</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#736159]">
          <Filter className="w-4 h-4" />
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="card overflow-hidden bg-white border-[#C9D8C5]">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#736159]">
            Loading log book...
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            heading="No care logs yet"
            subtext="Log your first watering, fertilizing, or repotting event to track your plant's history."
            actionLabel="Add a Log Entry"
            onAction={() => setIsModalOpen(true)}
            image="/images/plants/fiddle-leaf.webp"
          />
        ) : (
          <div className="divide-y divide-[#C9D8C5]/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F1E6]/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  {getActionBadge(log.action)}
                  <div>
                    <p className="font-serif font-semibold text-sm text-[#1F3D2B]">
                      {log.plant_nickname || 'Plant'}
                    </p>
                    <p className="text-xs text-[#736159] mt-0.5">
                      {log.notes || 'Routine scheduled care'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                  <span className="text-[#736159] font-medium">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 rounded-lg text-[#736159] hover:text-[#C8693F] hover:bg-[#FBECE6] transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#C9D8C5]/50 flex items-center justify-between text-xs text-[#736159]">
            <span>
              Page {page} of {totalPages} ({totalLogs} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      <AddLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchLogs}
      />
    </div>
  );
};
