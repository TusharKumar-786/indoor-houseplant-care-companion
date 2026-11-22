import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Compass, Pencil, Trash2, Sprout, Sun, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { Room } from '../types';
import { AddRoomModal } from '../components/AddRoomModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export const RoomsPage: React.FC = () => {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/rooms');
      setRooms(res.data.data);
    } catch (err) {
      showToast('Failed to load rooms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (room: Room) => {
    const warning =
      room.plant_count > 0
        ? `"${room.name}" has ${room.plant_count} plant(s) assigned. Deleting will unassign them. Proceed?`
        : `Delete "${room.name}"?`;
    if (!window.confirm(warning)) return;
    try {
      await api.delete(`/rooms/${room.id}`);
      showToast('Room deleted successfully');
      fetchRooms();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete room', 'error');
    }
  };

  const getRoomPhoto = (direction?: string | null) => {
    const dir = (direction || '').toLowerCase();
    if (dir.includes('south')) return '/images/plants/living-room.webp';
    if (dir.includes('east')) return '/images/plants/monstera.webp';
    if (dir.includes('west')) return '/images/plants/fiddle-leaf.webp';
    return '/images/plants/succulent-shelf.webp';
  };

  const getLightLevelText = (direction?: string | null) => {
    const dir = (direction || '').toLowerCase();
    if (dir.includes('south')) return 'Bright Direct / High';
    if (dir.includes('east')) return 'Gentle Morning / Medium';
    if (dir.includes('west')) return 'Warm Afternoon / High';
    if (dir.includes('north')) return 'Diffused Indirect / Low';
    return 'Ambient Room Light';
  };

  return (
    <div className="space-y-6 animate-in py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
            Sunlight Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B] mt-0.5">
            Apartment Rooms & Microclimates
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
            Organize plants by window exposure and natural illumination
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingRoom(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3 bg-white border-[#C9D8C5]">
              <div className="skeleton h-40 rounded-xl" />
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-16" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          heading="No rooms mapped yet"
          subtext="Add living rooms, bedrooms, or balconies to check window directions against plant light needs."
          actionLabel="Add First Room"
          onAction={() => {
            setEditingRoom(null);
            setIsModalOpen(true);
          }}
          image="/images/plants/living-room.webp"
          showTips={true}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const photo = getRoomPhoto(room.window_direction);
            const lightLevel = getLightLevelText(room.window_direction);

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Room Cover Photo */}
                  <div className="relative h-44 overflow-hidden bg-[#ECE5D4]">
                    <img
                      src={photo}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F3D2B]/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#E4EDB8]">
                          {lightLevel}
                        </span>
                        <h3 className="font-serif font-bold text-xl leading-tight">
                          {room.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#736159]">
                        <Compass className="w-4 h-4 text-[#3E7B52]" />
                        <span>
                          {room.window_direction && room.window_direction !== 'None'
                            ? `${room.window_direction}-facing`
                            : 'No window specified'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1 font-semibold text-[#1F3D2B]">
                        <Sprout className="w-3.5 h-3.5 text-[#3E7B52]" />
                        <span>
                          {room.plant_count} plant{room.plant_count === 1 ? '' : 's'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#C9D8C5]/50">
                      <Link
                        to={`/plants?room_id=${room.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3D2B] hover:text-[#3E7B52] transition-colors"
                      >
                        <span>View plants</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(room)}
                          className="p-1.5 rounded-lg text-[#736159] hover:text-[#1F3D2B] hover:bg-[#F5F1E6] transition-colors"
                          title="Edit room"
                          aria-label="Edit room"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(room)}
                          className="p-1.5 rounded-lg text-[#736159] hover:text-[#C8693F] hover:bg-[#FBECE6] transition-colors"
                          title="Delete room"
                          aria-label="Delete room"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <AddRoomModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRoom(null);
        }}
        onSaved={fetchRooms}
        editingRoom={editingRoom}
      />
    </div>
  );
};
