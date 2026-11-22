import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Sprout,
  DoorClosed,
  ChevronRight,
  Droplets,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { Plant, Room } from '../types';
import { Button } from '../components/ui/Button';
import { assetUrl } from '../utils/image';
import { EmptyState } from '../components/ui/EmptyState';

const PLACEHOLDER = '/images/plants/monstera.webp';

export const PlantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlants = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (selectedRoom) params.room_id = selectedRoom;
      const res = await api.get('/plants', { params });
      setPlants(res.data.data);
    } catch (err) {
      console.error('Failed to fetch plants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPlants(), 200);
    return () => clearTimeout(timer);
  }, [search, selectedRoom]);

  const SkeletonRow = () => (
    <div className="card p-4 flex items-center gap-4 bg-white border-[#C9D8C5]">
      <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-20" />
      </div>
      <div className="skeleton h-8 w-16 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            My Plant Collection
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
            {plants.length} plant{plants.length === 1 ? '' : 's'} tracked across your rooms
          </p>
        </div>
        <Link to="/add-plant" className="self-start sm:self-auto">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Add Plant
          </Button>
        </Link>
      </div>

      {/* Search & Room Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736159]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plants by nickname or botanical species..."
            className="input-botanical pl-10"
          />
        </div>
        <div className="relative sm:w-48">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="input-botanical appearance-none pr-9"
          >
            <option value="">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#736159]">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Plant List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : plants.length === 0 ? (
        !search && !selectedRoom ? (
          <EmptyState
            heading="No plants yet"
            subtext="Add your first houseplant to start tracking care schedules, watering logs, and health."
            actionLabel="Add Your First Plant"
            actionTo="/add-plant"
            image="/images/plants/snake-plant.webp"
          />
        ) : (
          <div className="card p-12 text-center flex flex-col items-center gap-3 bg-white border-[#C9D8C5] border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1F3D2B]">No plants matched</h3>
            <p className="text-xs text-[#736159] max-w-sm">
              No specimens matched your search or room filter.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {plants.map((plant) => (
            <div
              key={plant.id}
              onClick={() => navigate(`/plants/${plant.id}`)}
              className="card p-4 sm:p-5 flex items-center gap-4 cursor-pointer group hover:shadow-card transition-all bg-white border-[#C9D8C5]"
            >
              {/* Plant Image */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 bg-[#ECE5D4] border border-[#C9D8C5]">
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
                  {plant.species}
                </p>

                {/* Mobile watering status indicator */}
                <div className="sm:hidden text-xs">
                  <span
                    className={
                      plant.is_due
                        ? 'font-bold text-[#C8693F]'
                        : 'text-[#736159]'
                    }
                  >
                    {plant.is_due
                      ? 'Watering due today'
                      : plant.days_until_next_watering != null &&
                        plant.days_until_next_watering > 0
                      ? `Due in ${plant.days_until_next_watering}d`
                      : 'Upcoming'}
                  </span>
                </div>
              </div>

              {/* Desktop Watering Info & CTA */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] block font-medium text-[#736159]">
                    <Droplets className="inline w-3 h-3 mr-0.5 text-[#3E7B52]" />
                    Next Care
                  </span>
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
                </div>

                <Button variant="quiet" size="sm" className="hidden sm:inline-flex">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
