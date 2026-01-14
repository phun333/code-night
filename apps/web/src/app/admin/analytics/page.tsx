'use client';

import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  Percent,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

interface AnalyticsData {
  dailyTrend: { date: string; count: number; completed: number }[];
  byService: { name: string; value: number }[];
  byCity: { city: string; count: number }[];
  byUrgency: { HIGH: number; MEDIUM: number; LOW: number };
  hourlyDistribution: { hour: number; count: number }[];
  kpis: {
    avgResolutionTime: number;
    todayVolume: number;
    volumeChange: number;
    resourceUtilization: number;
    completionRate: number;
    highPriorityRate: number;
    totalAllocations: number;
  };
}

const SERVICE_COLORS: Record<string, string> = {
  Superonline: '#0065a1',
  Paycell: '#ffc72c',
  'TV+': '#e31837',
};

const URGENCY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();

  const fetchAnalytics = useCallback(async () => {
    try {
      const result = await fetchAPI<AnalyticsData>('/api/analytics');
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const unsub = subscribe('allocation:completed', () => {
      fetchAnalytics();
    });
    return () => unsub();
  }, [subscribe, fetchAnalytics]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} sn`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes} dk ${secs} sn` : `${minutes} dk`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Veri yuklenemedi</p>
      </div>
    );
  }

  const urgencyData = [
    { name: 'Yuksek', value: data.byUrgency.HIGH, color: URGENCY_COLORS.HIGH },
    { name: 'Orta', value: data.byUrgency.MEDIUM, color: URGENCY_COLORS.MEDIUM },
    { name: 'Dusuk', value: data.byUrgency.LOW, color: URGENCY_COLORS.LOW },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Proje yonetimi icin performans metrikleri</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Daily Volume */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gunluk Islem Hacmi</p>
                <p className="text-3xl font-bold">{data.kpis.todayVolume}</p>
                <div className="flex items-center gap-1 mt-1">
                  {data.kpis.volumeChange >= 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      data.kpis.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    %{Math.abs(data.kpis.volumeChange)}
                  </span>
                  <span className="text-xs text-muted-foreground">dunden bu yana</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Resolution Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ort. Cozum Suresi</p>
                <p className="text-3xl font-bold">{formatDuration(data.kpis.avgResolutionTime)}</p>
                <p className="text-xs text-muted-foreground mt-1">tamamlanan islemler icin</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Kaynak Kullanim Orani</p>
                <p className="text-3xl font-bold">%{data.kpis.resourceUtilization}</p>
                <Progress
                  value={data.kpis.resourceUtilization}
                  className="mt-2 h-2"
                />
              </div>
              <div className="p-3 bg-orange-100 rounded-full ml-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamamlanma Orani</p>
                <p className="text-3xl font-bold">%{data.kpis.completionRate}</p>
                <p className="text-xs text-muted-foreground mt-1">son 7 gun</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Allocations */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Islem</p>
                <p className="text-3xl font-bold">{data.kpis.totalAllocations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">tum zamanlar</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Priority Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yuksek Oncelik Orani</p>
                <p className="text-3xl font-bold">%{data.kpis.highPriorityRate}</p>
                <p className="text-xs text-muted-foreground mt-1">son 7 gun</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Percent className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 7 Day Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">7 Gunluk Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Toplam"
                  stroke="#0065a1"
                  strokeWidth={2}
                  dot={{ fill: '#0065a1', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Tamamlanan"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Servis Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.byService}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {data.byService.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SERVICE_COLORS[entry.name] || '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* City Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sehir Bazli Dagilim</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" name="Islem Sayisi" fill="#0065a1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Urgency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aciliyet Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={urgencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" name="Islem Sayisi" radius={[4, 4, 0, 0]}>
                  {urgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Saatlik Yogunluk (Son 24 Saat)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour.toString().padStart(2, '0')}:00`}
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                labelFormatter={(hour) => `${hour.toString().padStart(2, '0')}:00`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" name="Islem Sayisi" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
