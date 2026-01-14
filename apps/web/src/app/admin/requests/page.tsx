'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';
import { Plus, Filter } from 'lucide-react';

interface Request {
  id: string;
  userId: string;
  service: string;
  requestType: string;
  urgency: string;
  status: string;
  createdAt: string;
  priorityScore: number;
  user: {
    id: string;
    name: string;
    city: string;
  };
  allocation?: any;
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'HIGH': return 'bg-red-500 text-white';
    case 'MEDIUM': return 'bg-yellow-500 text-white';
    case 'LOW': return 'bg-green-500 text-white';
    default: return '';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    default: return '';
  }
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', urgency: '' });
  const [showNewForm, setShowNewForm] = useState(false);
  const { subscribe } = useWebSocket();

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.urgency) params.append('urgency', filter.urgency);

      const result = await fetchAPI<Request[]>(`/api/requests?${params}`);
      setRequests(result);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  useEffect(() => {
    const unsub1 = subscribe('request:new', fetchRequests);
    const unsub2 = subscribe('dashboard:refresh', fetchRequests);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe]);

  const handleAllocate = async (requestId: string) => {
    try {
      await fetchAPI('/api/allocations', {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      fetchRequests();
    } catch (error) {
      console.error('Error allocating:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Talepler</h1>
          <p className="text-muted-foreground">Tum talepleri yonetin</p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Talep
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex gap-4 items-center pt-6">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            className="border rounded-lg px-3 py-2"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">Tum Durumlar</option>
            <option value="PENDING">Bekliyor</option>
            <option value="ASSIGNED">Atandi</option>
            <option value="COMPLETED">Tamamlandi</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            value={filter.urgency}
            onChange={(e) => setFilter({ ...filter, urgency: e.target.value })}
          >
            <option value="">Tum Oncelikler</option>
            <option value="HIGH">Yuksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Dusuk</option>
          </select>
        </CardContent>
      </Card>

      {/* New Request Form Modal */}
      {showNewForm && (
        <NewRequestForm
          onClose={() => setShowNewForm(false)}
          onSuccess={() => {
            setShowNewForm(false);
            fetchRequests();
          }}
        />
      )}

      {/* Requests Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Kullanici</th>
                  <th className="pb-3">Servis</th>
                  <th className="pb-3">Tur</th>
                  <th className="pb-3">Oncelik</th>
                  <th className="pb-3">Skor</th>
                  <th className="pb-3">Durum</th>
                  <th className="pb-3">Tarih</th>
                  <th className="pb-3">Islem</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-sm">{request.id.slice(0, 8)}...</td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-sm text-muted-foreground">{request.user.city}</p>
                      </div>
                    </td>
                    <td className="py-3">{request.service}</td>
                    <td className="py-3 text-sm">{request.requestType.replace(/_/g, ' ')}</td>
                    <td className="py-3">
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </td>
                    <td className="py-3 font-bold text-[#0065a1]">
                      {request.priorityScore}
                    </td>
                    <td className="py-3">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3">
                      {request.status === 'PENDING' && (
                        <Button size="sm" onClick={() => handleAllocate(request.id)}>
                          Ata
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewRequestForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    userId: '',
    service: 'Superonline',
    requestType: 'CONNECTION_ISSUE',
    urgency: 'MEDIUM',
  });

  useEffect(() => {
    fetchAPI<any[]>('/api/auth/users').then(setUsers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/api/requests', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yeni Talep Olustur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kullanici</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                required
              >
                <option value="">Secin</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Servis</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                <option value="Superonline">Superonline</option>
                <option value="Paycell">Paycell</option>
                <option value="TV+">TV+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Talep Turu</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.requestType}
                onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              >
                <option value="CONNECTION_ISSUE">Baglanti Sorunu</option>
                <option value="PAYMENT_PROBLEM">Odeme Sorunu</option>
                <option value="STREAMING_ISSUE">Yayin Sorunu</option>
                <option value="SPEED_COMPLAINT">Hiz Sikayeti</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Aciliyet</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                <option value="HIGH">Yuksek</option>
                <option value="MEDIUM">Orta</option>
                <option value="LOW">Dusuk</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Iptal
              </Button>
              <Button type="submit" className="flex-1 bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90">
                Olustur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
