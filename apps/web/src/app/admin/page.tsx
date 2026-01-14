'use client';

import {
  Activity,
  ArrowDown,
  ArrowRight,
  CheckCircle,
  Clock,
  Pause,
  Play,
  RotateCcw,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

interface DashboardData {
  stats: {
    pendingRequests: number;
    activeAllocations: number;
    completedAllocations: number;
    queuedRequests: number;
    todayCompleted: number;
  };
  automationStatus: {
    isRunning: boolean;
    cycleCount: number;
  };
  priorityQueue: any[];
  recentAllocations: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentCompleted, setRecentCompleted] = useState<any[]>([]);
  const { subscribe, isConnected } = useWebSocket();

  const fetchDashboard = async () => {
    try {
      const result = await fetchAPI<DashboardData>('/api/dashboard/summary');
      setData(result);

      // Get recently completed (last 10 completed allocations)
      const completed = result.recentAllocations
        .filter((a: any) => a.status === 'COMPLETED')
        .slice(0, 10);
      setRecentCompleted(completed);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub1 = subscribe('dashboard:refresh', fetchDashboard);
    const unsub2 = subscribe('allocation:new', fetchDashboard);
    const unsub3 = subscribe('allocation:completed', fetchDashboard);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe]);

  const handleToggleAutomation = async () => {
    try {
      const endpoint = data?.automationStatus.isRunning
        ? '/api/automation/stop'
        : '/api/automation/start';
      await fetchAPI(endpoint, { method: 'POST' });
      fetchDashboard();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleRestart = async () => {
    try {
      await fetchAPI('/api/automation/restart', { method: 'POST' });
      fetchDashboard();
    } catch (error) {
      console.error('Error restarting automation:', error);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500';
    }
  };

  // Active allocations (currently being processed)
  const activeAllocations = data.recentAllocations
    .filter((a: any) => a.status === 'ASSIGNED')
    .slice(0, 8);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Otomasyon Merkezi</h1>
          <p className="text-sm text-muted-foreground">Turkcell Smart Allocation</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Automation Status */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              data.automationStatus.isRunning
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                data.automationStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              {data.automationStatus.isRunning ? 'AKTIF' : 'DURDU'}
            </span>
            <span className="text-sm">#{data.automationStatus.cycleCount}</span>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm">{isConnected ? 'Canli' : 'Baglanti Yok'}</span>
          </div>

          {/* Restart Button */}
          <Button onClick={handleRestart} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Sifirla ve Baslat
          </Button>

          {/* Toggle Button */}
          <Button
            onClick={handleToggleAutomation}
            variant={data.automationStatus.isRunning ? 'destructive' : 'default'}
            className="gap-2"
          >
            {data.automationStatus.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Durdur
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Baslat
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Kuyrukta Bekleyen</p>
                <p className="text-4xl font-bold text-orange-800">{data.stats.queuedRequests}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Aktif Islem</p>
                <p className="text-4xl font-bold text-purple-800">{data.stats.activeAllocations}</p>
              </div>
              <Activity className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Bugun Tamamlanan</p>
                <p className="text-4xl font-bold text-green-800">+{data.stats.todayCompleted}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Toplam Tamamlanan</p>
                <p className="text-4xl font-bold text-blue-800">
                  {data.stats.completedAllocations}
                </p>
              </div>
              <Zap className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Flow */}
      <div className="grid grid-cols-3 gap-4">
        {/* Incoming Tasks (Queue) */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-t-lg">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDown className="w-4 h-4" />
              Gelen Talepler
              <Badge variant="secondary" className="bg-white/20 text-white ml-auto">
                {data.priorityQueue.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {data.priorityQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mb-3 text-green-500" />
                  <p className="font-medium">Kuyruk bos!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data.priorityQueue.slice(0, 15).map((request, index) => (
                    <div
                      key={request.id}
                      className={`p-3 hover:bg-muted/50 ${
                        index === 0 ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-orange-500 text-white'
                              : index < 3
                                ? 'bg-orange-200 text-orange-700'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {request.user?.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {request.service} - {request.user?.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getUrgencyColor(request.urgency)} text-xs`}>
                            {request.urgency === 'HIGH'
                              ? 'ACIL'
                              : request.urgency === 'MEDIUM'
                                ? 'ORTA'
                                : 'DUSUK'}
                          </Badge>
                          <p className="text-lg font-bold text-[#0065a1] mt-1">
                            {request.priorityScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Processing */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-t-lg">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              Aktif Islemler
              <Badge variant="secondary" className="bg-white/20 text-white ml-auto">
                {activeAllocations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {activeAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium">Aktif islem yok</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activeAllocations.map((allocation: any) => (
                    <div key={allocation.id} className="p-3 hover:bg-muted/50 bg-purple-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <Activity className="w-5 h-5 text-purple-600 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">
                              {allocation.request?.user?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {allocation.remainingSeconds}s
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {allocation.resource?.resourceType === 'TECH_TEAM'
                              ? 'Teknik'
                              : 'Destek'}{' '}
                            - {allocation.resource?.city}
                          </p>
                          {/* Progress Bar */}
                          <div className="mt-2">
                            <Progress
                              value={allocation.progress || 0}
                              className="h-1.5 [&>div]:bg-purple-500 [&>div]:transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-t-lg">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Tamamlanan Talepler
              <Badge variant="secondary" className="bg-white/20 text-white ml-auto">
                {recentCompleted.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {recentCompleted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium">Henuz tamamlanan yok</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentCompleted.map((allocation: any) => (
                    <div key={allocation.id} className="p-3 hover:bg-muted/50 bg-green-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {allocation.request?.user?.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {allocation.resource?.resourceType === 'TECH_TEAM'
                              ? 'Teknik Ekip'
                              : 'Destek Ekip'}{' '}
                            - {allocation.resource?.city}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            {allocation.request?.service}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            {allocation.completedAt
                              ? formatTime(allocation.completedAt)
                              : formatTime(allocation.timestamp)}
                          </span>
                          <p className="text-lg font-bold text-green-600">
                            {allocation.priorityScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
