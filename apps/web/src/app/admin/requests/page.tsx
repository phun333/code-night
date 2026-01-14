'use client';

import { Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

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
    case 'HIGH':
      return 'bg-red-500 text-white';
    case 'MEDIUM':
      return 'bg-yellow-500 text-white';
    case 'LOW':
      return 'bg-green-500 text-white';
    default:
      return '';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    default:
      return '';
  }
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', urgency: '' });
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
                      <Badge className={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                    </td>
                    <td className="py-3 font-bold text-[#0065a1]">{request.priorityScore}</td>
                    <td className="py-3">
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleString('tr-TR')}
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
