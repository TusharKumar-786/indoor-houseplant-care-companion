import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sprout, 
  BookOpen, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Search,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';

interface AdminStats {
  totals: {
    users: number;
    plants: number;
    care_logs: number;
    contact_messages: number;
    unread_messages: number;
  };
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    city: string | null;
    created_at: string;
    plant_count: number;
  }>;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  plant_count: number;
  room_count: number;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, messagesRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/contact-messages'),
        api.get('/admin/users?limit=50'),
      ]);
      setStats(statsRes.data.data);
      setMessages(messagesRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch admin metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      setMarkingId(id);
      await api.put(`/admin/contact-messages/${id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
      if (stats) {
        setStats({
          ...stats,
          totals: {
            ...stats.totals,
            unread_messages: Math.max(0, stats.totals.unread_messages - 1),
          },
        });
      }
      showToast('Message marked as resolved');
    } catch (err) {
      showToast('Failed to update message status', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.city && u.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4EDB8] text-[#1F3D2B]">
              <ShieldCheck className="w-3.5 h-3.5" />
              LeafPulse Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-0.5">
            System metrics, customer care messages, and registered gardener accounts
          </p>
        </div>

        <Button
          variant="quiet"
          size="sm"
          onClick={fetchAdminData}
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Data
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#C9D8C5]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative ${
            activeTab === 'overview'
              ? 'text-[#1F3D2B] border-b-2 border-[#1F3D2B]'
              : 'text-[#736159] hover:text-[#1F3D2B]'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'inquiries'
              ? 'text-[#1F3D2B] border-b-2 border-[#1F3D2B]'
              : 'text-[#736159] hover:text-[#1F3D2B]'
          }`}
        >
          Inquiries
          {stats && stats.totals.unread_messages > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#C8693F] text-white">
              {stats.totals.unread_messages}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative ${
            activeTab === 'users'
              ? 'text-[#1F3D2B] border-b-2 border-[#1F3D2B]'
              : 'text-[#736159] hover:text-[#1F3D2B]'
          }`}
        >
          User Directory ({users.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 bg-white border-[#C9D8C5]">
              <div className="flex items-center justify-between text-[#736159] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Gardeners</span>
                <Users className="w-4 h-4 text-[#3E7B52]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1F3D2B]">
                {stats?.totals.users || 0}
              </div>
              <div className="text-xs text-[#736159] mt-1">Registered users</div>
            </div>

            <div className="card p-5 bg-white border-[#C9D8C5]">
              <div className="flex items-center justify-between text-[#736159] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Plants Tracked</span>
                <Sprout className="w-4 h-4 text-[#3E7B52]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1F3D2B]">
                {stats?.totals.plants || 0}
              </div>
              <div className="text-xs text-[#736159] mt-1">Across all collections</div>
            </div>

            <div className="card p-5 bg-white border-[#C9D8C5]">
              <div className="flex items-center justify-between text-[#736159] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Care Logs</span>
                <BookOpen className="w-4 h-4 text-[#3E7B52]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#1F3D2B]">
                {stats?.totals.care_logs || 0}
              </div>
              <div className="text-xs text-[#736159] mt-1">Watering, feeds, pruning</div>
            </div>

            <div className="card p-5 bg-white border-[#C9D8C5]">
              <div className="flex items-center justify-between text-[#736159] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Unread Inquiries</span>
                <Mail className="w-4 h-4 text-[#C8693F]" />
              </div>
              <div className="text-3xl font-serif font-bold text-[#C8693F]">
                {stats?.totals.unread_messages || 0}
              </div>
              <div className="text-xs text-[#736159] mt-1">
                Out of {stats?.totals.contact_messages || 0} total
              </div>
            </div>
          </div>

          {/* Recent Signups */}
          <div className="card p-6 bg-white border-[#C9D8C5]">
            <h2 className="text-lg font-serif font-bold text-[#1F3D2B] mb-4">
              Recent Signups
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#C9D8C5] text-[#736159]">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">City</th>
                    <th className="pb-3 font-semibold">Plants</th>
                    <th className="pb-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9D8C5]/40">
                  {stats?.recent_users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F1E6]/30">
                      <td className="py-3 font-semibold text-[#1F3D2B]">{u.name}</td>
                      <td className="py-3 text-[#736159]">{u.email}</td>
                      <td className="py-3 text-[#736159]">{u.city || '—'}</td>
                      <td className="py-3 text-[#1F3D2B] font-medium">{u.plant_count}</td>
                      <td className="py-3 text-[#736159]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contact Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="card p-12 text-center bg-white border-[#C9D8C5]">
              <Mail className="w-8 h-8 mx-auto text-[#736159] mb-2" />
              <p className="text-sm font-serif font-semibold text-[#1F3D2B]">No contact inquiries</p>
              <p className="text-xs text-[#736159] mt-1">Messages sent through the landing page contact form will appear here.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`card p-5 border transition-all ${
                  msg.is_read
                    ? 'bg-white border-[#C9D8C5] opacity-80'
                    : 'bg-[#FAF8F5] border-[#3E7B52]/40 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1F3D2B]">
                        {msg.name}
                      </span>
                      {!msg.is_read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C8693F]/15 text-[#C8693F]">
                          New
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-[#3E7B52] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {msg.email}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#736159] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                    {!msg.is_read && (
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => handleMarkAsRead(msg.id)}
                        isLoading={markingId === msg.id}
                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#3E7B52]" />}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#C9D8C5]/60 text-xs text-[#3B2F2A] leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: User Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#736159] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-botanical pl-9 py-2 text-xs"
              />
            </div>
            <span className="text-xs text-[#736159]">
              Showing {filteredUsers.length} of {users.length} gardeners
            </span>
          </div>

          <div className="card bg-white border-[#C9D8C5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#C9D8C5]">
                  <tr className="text-[#736159]">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">City</th>
                    <th className="py-3 px-4 font-semibold text-center">Plants</th>
                    <th className="py-3 px-4 font-semibold text-center">Rooms</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9D8C5]/40">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F1E6]/30">
                      <td className="py-3 px-4 font-semibold text-[#1F3D2B]">{u.name}</td>
                      <td className="py-3 px-4 text-[#736159]">{u.email}</td>
                      <td className="py-3 px-4 text-[#736159]">{u.city || '—'}</td>
                      <td className="py-3 px-4 text-center font-medium text-[#1F3D2B]">{u.plant_count}</td>
                      <td className="py-3 px-4 text-center text-[#736159]">{u.room_count}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.is_active
                              ? 'bg-[#E4EDB8] text-[#1F3D2B]'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#736159]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
