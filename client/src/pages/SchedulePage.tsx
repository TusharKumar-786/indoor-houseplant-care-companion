import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Droplets,
  DoorClosed,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Plant } from '../types';
import { Button } from '../components/ui/Button';
import { localDateString } from '../utils/date';
import { assetUrl } from '../utils/image';
import { EmptyState } from '../components/ui/EmptyState';

const PLACEHOLDER = '/images/plants/monstera.webp';

export const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [counts, setCounts] = useState({
    due_today_count: 0,
    next_7_days_count: 0,
    total_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/schedule?filter=${filter}`);
      setPlants(res.data.data);
      if (res.data.meta?.counts) setCounts(res.data.meta.counts);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [filter]);

  const handleWater = async (plantId: number, plantName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/logs', {
        plant_id: plantId,
        action: 'Watered',
        date: localDateString(),
        notes: 'Watered from Care Schedule',
      });
      showToast(`Watered ${plantName}!`);
      fetchSchedule();
    } catch (err) {
      showToast('Failed to log watering', 'error');
    }
  };

  const tabs = [
    { key: 'today', label: 'Due Today', count: counts.due_today_count },
    { key: 'week', label: 'Next 7 Days', count: counts.next_7_days_count },
    { key: 'all', label: 'All Plants', count: counts.total_count },
  ] as const;

  return (
    <div className="space-y-6 animate-in py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
          Care Schedule
        </h1>
        <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
          Upcoming hydration and feeding schedules across your collection
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#C9D8C5]">
        {tabs.map(({ key, label, count }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                active
                  ? 'bg-[#1F3D2B] text-white shadow-xs'
                  : 'bg-white text-[#736159] border border-[#C9D8C5] hover:bg-[#F5F1E6]'
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[#ECE5D4] text-[#1F3D2B]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 flex items-center gap-4 bg-white border-[#C9D8C5]">
              <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : plants.length === 0 ? (
        <EmptyState
          heading={filter === 'today' ? 'All caught up today' : 'No upcoming tasks'}
          subtext="Your plants are well cared for. Check back after your next watering cycle."
          actionLabel="View My Plants"
          actionTo="/plants"
          image="/images/plants/pothos.webp"
          showTips={true}
        />
      ) : (
        <div className="space-y-3">
          {plants.map((plant) => (
            <div
              key={plant.id}
              onClick={() => navigate(`/plants/${plant.id}`)}
              className="card p-4 sm:p-5 flex items-center gap-4 cursor-pointer group hover:shadow-card transition-all bg-white border-[#C9D8C5]"
            >
              {/* Photo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#ECE5D4] border border-[#C9D8C5]">
                <img
                  src={assetUrl(plant.image_url) || PLACEHOLDER}
                  alt={plant.nickname}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
              </div>

              {/* Plant Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-[#1F3D2B] group-hover:text-[#3E7B52] transition-colors">
                    {plant.nickname}
                  </h3>
                  {plant.room && (
                    <span className="badge-sage flex items-center gap-1">
                      <DoorClosed className="w-3 h-3" />
                      {plant.room}
                    </span>
                  )}
                </div>
                <p className="text-xs italic text-[#736159] truncate">
                  {plant.species} • Every {plant.water_frequency_days} days
                </p>
              </div>

              {/* Due Date & Action */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <span
                    className={`text-xs font-bold ${
                      plant.is_due ? 'text-[#C8693F]' : 'text-[#1F3D2B]'
                    }`}
                  >
                    {plant.is_due
                      ? 'Due Today'
                      : plant.days_until_next_watering != null &&
                        plant.days_until_next_watering > 0
                      ? `In ${plant.days_until_next_watering} days`
                      : 'Upcoming'}
                  </span>
                  <p className="text-[11px] text-[#736159]">
                    {plant.next_watering_date}
                  </p>
                </div>

                <Button
                  variant={plant.is_due ? 'accent' : 'quiet'}
                  size="sm"
                  onClick={(e) => handleWater(plant.id, plant.nickname, e)}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Water</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
