'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';
import { Server, Users, MapPin } from 'lucide-react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'bg-green-100 text-green-800';
    case 'BUSY': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface Resource {
  id: string;
  resourceType: string;
  capacity: number;
  city: string;
  status: string;
  activeAllocations: number;
  utilization: number;
  allocations: any[];
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();

  const fetchResources = async () => {
    try {
      const result = await fetchAPI<Resource[]>('/api/resources');
      setResources(result);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    const unsub1 = subscribe('resource:updated', fetchResources);
    const unsub2 = subscribe('dashboard:refresh', fetchResources);
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

  // Group by city
  const byCity = resources.reduce((acc, resource) => {
    if (!acc[resource.city]) acc[resource.city] = [];
    acc[resource.city].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kaynaklar</h1>
        <p className="text-gray-500">Kaynak kapasitelerini ve durumlarini goruntuleyun</p>
      </div>

      {Object.entries(byCity).map(([city, cityResources]) => (
        <div key={city}>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {city}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityResources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {resource.resourceType === 'TECH_TEAM' ? (
                        <Server className="w-5 h-5 text-[#0065a1]" />
                      ) : (
                        <Users className="w-5 h-5 text-[#0065a1]" />
                      )}
                      {resource.resourceType === 'TECH_TEAM'
                        ? 'Teknik Ekip'
                        : 'Destek Personeli'}
                    </CardTitle>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Kapasite</span>
                        <span className="font-medium">
                          {resource.activeAllocations} / {resource.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            resource.utilization >= 100
                              ? 'bg-red-500'
                              : resource.utilization >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    {resource.allocations.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Aktif Atamalar:</p>
                        <div className="space-y-2">
                          {resource.allocations
                            .filter((a) => a.status === 'ASSIGNED')
                            .map((allocation) => (
                              <div
                                key={allocation.id}
                                className="text-sm bg-gray-50 p-2 rounded"
                              >
                                <p className="font-medium">
                                  {allocation.request?.user?.name}
                                </p>
                                <p className="text-gray-500">
                                  {allocation.request?.service} -{' '}
                                  {allocation.request?.requestType.replace(/_/g, ' ')}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
