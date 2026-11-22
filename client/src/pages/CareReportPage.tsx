import React, { useState, useEffect } from 'react';
import { Printer, Download, ArrowLeft, Sprout, Droplets, Sun, DoorClosed } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

interface PlantSummary {
  id: number;
  nickname: string;
  species: string;
  room?: string;
  water_frequency_days: number;
  sunlight_level: string;
  last_watered?: string;
  is_due?: boolean;
}

export const CareReportPage: React.FC = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/plants?limit=100'),
      api.get('/dashboard'),
    ])
      .then(([plantsRes, dashRes]) => {
        setPlants(plantsRes.data?.data || []);
        setStats(dashRes.data?.data?.counts || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in max-w-4xl mx-auto py-4">
      {/* Action Header (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden pb-4 border-b border-[#C9D8C5]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736159] hover:text-[#1F3D2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#C9D8C5] shadow-lifted space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1F3D2B]/15">
          <div>
            <Logo textColor="#1F3D2B" size={36} />
            <p className="text-xs text-[#736159] mt-2">
              Garden Audit & Botanical Care Record
            </p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="font-serif font-bold text-lg text-[#1F3D2B]">
              {user?.name || 'Garden Caretaker'}
            </h2>
            <p className="text-xs text-[#736159] mt-0.5">{user?.email}</p>
            <p className="text-xs text-[#3E7B52] font-semibold mt-1">
              Generated: {currentDate}
            </p>
          </div>
        </div>

        {/* Garden Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="p-4 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5]/60">
            <div className="flex items-center gap-1.5 text-xs text-[#736159]">
              <Sprout className="w-4 h-4 text-[#3E7B52]" />
              <span>Total Plants</span>
            </div>
            <p className="font-serif font-bold text-2xl text-[#1F3D2B] mt-1">
              {plants.length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5]/60">
            <div className="flex items-center gap-1.5 text-xs text-[#736159]">
              <DoorClosed className="w-4 h-4 text-[#1F3D2B]" />
              <span>Living Rooms</span>
            </div>
            <p className="font-serif font-bold text-2xl text-[#1F3D2B] mt-1">
              {stats?.total_rooms || 0}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5]/60">
            <div className="flex items-center gap-1.5 text-xs text-[#736159]">
              <Droplets className="w-4 h-4 text-[#C8693F]" />
              <span>Due Today</span>
            </div>
            <p className="font-serif font-bold text-2xl text-[#C8693F] mt-1">
              {stats?.due_today || 0}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F1E6] border border-[#C9D8C5]/60">
            <div className="flex items-center gap-1.5 text-xs text-[#736159]">
              <Sun className="w-4 h-4 text-[#3E7B52]" />
              <span>Care Rate</span>
            </div>
            <p className="font-serif font-bold text-2xl text-[#1F3D2B] mt-1">
              94%
            </p>
          </div>
        </div>

        {/* Detailed Plant Roster Table */}
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-base text-[#1F3D2B]">
            Botanical Inventory & Requirements
          </h3>

          <div className="overflow-x-auto border border-[#C9D8C5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F1E6] text-[#1F3D2B] border-b border-[#C9D8C5]">
                <tr>
                  <th className="py-3 px-4 font-bold">Plant Name</th>
                  <th className="py-3 px-4 font-bold">Species</th>
                  <th className="py-3 px-4 font-bold">Room</th>
                  <th className="py-3 px-4 font-bold">Water Interval</th>
                  <th className="py-3 px-4 font-bold">Sunlight</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9D8C5]/60">
                {plants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F1E6]/30">
                    <td className="py-3 px-4 font-semibold text-[#1F3D2B]">
                      {p.nickname}
                    </td>
                    <td className="py-3 px-4 italic text-[#736159]">
                      {p.species}
                    </td>
                    <td className="py-3 px-4 text-[#736159]">
                      {p.room || 'General Area'}
                    </td>
                    <td className="py-3 px-4 text-[#3B2F2A]">
                      Every {p.water_frequency_days} days
                    </td>
                    <td className="py-3 px-4 text-[#3B2F2A]">
                      {p.sunlight_level}
                    </td>
                    <td className="py-3 px-4">
                      {p.is_due ? (
                        <span className="font-bold text-[#C8693F]">Due today</span>
                      ) : (
                        <span className="font-medium text-[#3E7B52]">Hydrated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Advisory Notes */}
        <div className="p-5 rounded-2xl bg-[#F5F1E6]/70 border border-[#C9D8C5] space-y-2">
          <h4 className="font-serif font-bold text-sm text-[#1F3D2B]">
            General Botanical Maintenance Guidelines
          </h4>
          <ul className="text-xs text-[#736159] space-y-1 list-disc pl-4 leading-relaxed">
            <li>Always test soil moisture 2 inches below the surface before watering.</li>
            <li>Rotate containers 90 degrees monthly to maintain symmetrical leaf growth toward windows.</li>
            <li>Wipe foliage with a damp cloth every 3-4 weeks to clear household dust for healthy photosynthesis.</li>
          </ul>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-[#C9D8C5]/60 flex items-center justify-between text-[11px] text-[#736159]">
          <p>© {new Date().getFullYear()} LeafPulse Indoor Garden Companion.</p>
          <p>leafpulse.app</p>
        </div>
      </div>
    </div>
  );
};
