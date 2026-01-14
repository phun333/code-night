'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';

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
    case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return '';
  }
};

interface Allocation {
  id: string;
  requestId: string;
  resourceId: string;
  priorityScore: number;
  status: string;
  timestamp: string;
  request: {
    id: string;
    service: string;
    requestType: string;
    urgency: string;
    user: {
      name: string;
      city: string;
    };
  };
  resource: {
    resourceType: string;
    city: string;
  };
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { subscribe } = useWebSocket();

  const fetchAllocations = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const result = await fetchAPI<Allocation[]>(`/api/allocations${params}`);
      setAllocations(result);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [filter]);

  useEffect(() => {
    const unsub1 = subscribe('allocation:new', fetchAllocations);
    const unsub2 = subscribe('dashboard:refresh', fetchAllocations);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe]);

  const handleComplete = async (allocationId: string) => {
    try {
      await fetchAPI(`/api/allocations/${allocationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      fetchAllocations();
    } catch (error) {
      console.error('Error completing allocation:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Atamalar</h1>
          <p className="text-gray-500">Tum atamalari goruntuleyun ve yonetin</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === '' ? 'default' : 'outline'}
            onClick={() => setFilter('')}
          >
            Tumu
          </Button>
          <Button
            variant={filter === 'ASSIGNED' ? 'default' : 'outline'}
            onClick={() => setFilter('ASSIGNED')}
          >
            Aktif
          </Button>
          <Button
            variant={filter === 'COMPLETED' ? 'default' : 'outline'}
            onClick={() => setFilter('COMPLETED')}
          >
            Tamamlanan
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {allocations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              Henuz atama yok
            </CardContent>
          </Card>
        ) : (
          allocations.map((allocation) => (
            <Card key={allocation.id}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div
                    className={`p-3 rounded-lg ${
                      allocation.status === 'COMPLETED'
                        ? 'bg-green-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    {allocation.status === 'COMPLETED' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-purple-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {allocation.request.user.name}
                      </span>
                      <Badge className={getUrgencyColor(allocation.request.urgency)}>
                        {allocation.request.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {allocation.request.service} -{' '}
                      {allocation.request.requestType.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div className="border-l pl-6">
                    <p className="text-sm text-gray-500">Kaynak</p>
                    <p className="font-medium">
                      {allocation.resource.resourceType === 'TECH_TEAM'
                        ? 'Teknik Ekip'
                        : 'Destek Personeli'}{' '}
                      - {allocation.resource.city}
                    </p>
                  </div>

                  <div className="border-l pl-6">
                    <p className="text-sm text-gray-500">Oncelik Skoru</p>
                    <p className="font-bold text-2xl text-[#0065a1]">
                      {allocation.priorityScore}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(allocation.status)}>
                      {allocation.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(allocation.timestamp).toLocaleString('tr-TR')}
                    </p>
                  </div>

                  {allocation.status === 'ASSIGNED' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleComplete(allocation.id)}
                    >
                      Tamamla
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
