'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Server,
  Zap,
  Bell,
  ArrowUp,
  User,
  Wifi,
} from 'lucide-react';

interface DashboardData {
  stats: {
    pendingRequests: number;
    activeAllocations: number;
    completedAllocations: number;
    totalResources: number;
  };
  resourceUtilization: {
    resourceId: string;
    resourceType: string;
    city: string;
    capacity: number;
    used: number;
    percentage: number;
    status: string;
  }[];
  recentAllocations: any[];
  priorityQueue: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const { subscribe, isConnected } = useWebSocket();

  const fetchDashboard = async () => {
    console.log('Fetching dashboard...');
    try {
      const result = await fetchAPI<DashboardData>('/api/dashboard/summary');
      console.log('Dashboard data:', result);
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const unsub1 = subscribe('dashboard:refresh', fetchDashboard);
    const unsub2 = subscribe('request:new', () => {
      setNewRequestAlert(true);
      fetchDashboard();
      setTimeout(() => setNewRequestAlert(false), 3000);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe]);

  const handleAutoAllocate = async () => {
    try {
      await fetchAPI('/api/allocations/auto', { method: 'POST' });
      fetchDashboard();
    } catch (error) {
      console.error('Error in auto-allocation:', error);
    }
  };

  const handleAllocateSingle = async (requestId: string) => {
    try {
      await fetchAPI('/api/allocations', {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });
      fetchDashboard();
    } catch (error) {
      console.error('Error allocating:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Superonline': return <Wifi className="w-4 h-4" />;
      case 'Paycell': return <span>💳</span>;
      case 'TV+': return <span>📺</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Komuta Merkezi</h1>
          <p className="text-muted-foreground">Turkcell Smart Allocation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Canli Baglanti' : 'Baglanti Yok'}
            </span>
          </div>
          <Button onClick={handleAutoAllocate} className="bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90">
            <Zap className="w-4 h-4 mr-2" />
            Toplu Atama
          </Button>
        </div>
      </div>

      {/* New Request Alert */}
      {newRequestAlert && (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
          <Bell className="w-5 h-5" />
          <span className="font-medium">Yeni talep geldi!</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Bekleyen</p>
                <p className="text-4xl font-bold text-yellow-800">{data.stats.pendingRequests}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Aktif</p>
                <p className="text-4xl font-bold text-purple-800">{data.stats.activeAllocations}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Tamamlanan</p>
                <p className="text-4xl font-bold text-green-800">{data.stats.completedAllocations}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Kaynaklar</p>
                <p className="text-4xl font-bold text-blue-800">{data.stats.totalResources}</p>
              </div>
              <Server className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Priority Queue Center Stage */}
      <div className="grid grid-cols-3 gap-6">
        {/* Priority Queue - Main Focus */}
        <Card className="col-span-2 border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-[#0065a1] to-[#004d7a] text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" />
                  Oncelik Sirasi
                </CardTitle>
                <CardDescription className="text-white/70">
                  Yuksek skorlu talepler onde
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {data.priorityQueue.length} Bekliyor
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {data.priorityQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                  <CheckCircle className="w-16 h-16 mb-4 text-green-500" />
                  <p className="text-lg font-medium">Tum talepler islendi!</p>
                  <p className="text-sm">Bekleyen talep bulunmuyor</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data.priorityQueue.map((request, index) => (
                    <div
                      key={request.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        index === 0 ? 'bg-red-50 border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-red-500 text-white' :
                            index < 3 ? 'bg-orange-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>

                          {/* User Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{request.user?.name}</span>
                              <span className="text-sm text-muted-foreground">• {request.user?.city}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getServiceIcon(request.service)}
                              <span className="text-sm">{request.service}</span>
                              <span className="text-xs text-muted-foreground">
                                {request.requestType.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Urgency Badge */}
                          <Badge className={getUrgencyColor(request.urgency)}>
                            {request.urgency === 'HIGH' ? 'ACIL' :
                             request.urgency === 'MEDIUM' ? 'ORTA' : 'DUSUK'}
                          </Badge>

                          {/* Priority Score */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#0065a1]">{request.priorityScore}</p>
                            <p className="text-xs text-muted-foreground">puan</p>
                          </div>

                          {/* Allocate Button */}
                          <Button
                            size="sm"
                            onClick={() => handleAllocateSingle(request.id)}
                            className="bg-[#0065a1] hover:bg-[#004d7a]"
                          >
                            Ata
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Resource Utilization */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="w-4 h-4" />
                Kaynak Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.resourceUtilization.map((resource) => (
                <div key={resource.resourceId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {resource.resourceType === 'TECH_TEAM' ? 'Teknik' : 'Destek'} • {resource.city}
                    </span>
                    <span className={`font-bold ${
                      resource.percentage >= 100 ? 'text-red-500' :
                      resource.percentage >= 70 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {resource.used}/{resource.capacity}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(resource.percentage, 100)}
                    className={`h-2 ${
                      resource.percentage >= 100 ? '[&>div]:bg-red-500' :
                      resource.percentage >= 70 ? '[&>div]:bg-yellow-500' :
                      '[&>div]:bg-green-500'
                    }`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Son Atamalar</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {data.recentAllocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Henuz atama yok
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentAllocations.slice(0, 5).map((allocation) => (
                      <div key={allocation.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          allocation.status === 'COMPLETED' ? 'bg-green-500' : 'bg-purple-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{allocation.request?.user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {allocation.request?.service} • {allocation.priorityScore} puan
                          </p>
                        </div>
                        <Badge variant={allocation.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                          {allocation.status === 'COMPLETED' ? 'Bitti' : 'Aktif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
