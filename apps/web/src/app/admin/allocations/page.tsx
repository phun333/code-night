'use client';

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  GitBranch,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

interface Allocation {
  id: string;
  requestId: string;
  resourceId: string;
  priorityScore: number;
  status: string;
  timestamp: string;
  completedAt?: string;
  expectedCompletionAt?: string;
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

interface Stats {
  total: number;
  assigned: number;
  completed: number;
  avgScore: number;
}

const URGENCY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ASSIGNED: { bg: 'bg-purple-100', text: 'text-purple-800' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
};

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Aktif',
  COMPLETED: 'Tamamlandi',
  CANCELLED: 'Iptal',
};

const URGENCY_LABELS: Record<string, string> = {
  HIGH: 'Yuksek',
  MEDIUM: 'Orta',
  LOW: 'Dusuk',
};

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, assigned: 0, completed: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', urgency: '' });
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const { subscribe } = useWebSocket();
  const limit = 50;

  const hasActiveFilters = filters.status || filters.urgency;

  const fetchAllocations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('skip', (page * limit).toString());
      if (filters.status) params.append('status', filters.status);

      const result = await fetchAPI<Allocation[]>(`/api/allocations?${params}`);

      // Filter by urgency on client side if needed
      let filtered = result;
      if (filters.urgency) {
        filtered = result.filter((a) => a.request.urgency === filters.urgency);
      }

      setAllocations(filtered);
      setTotal(result.length);

      // Calculate stats
      const assigned = result.filter((a) => a.status === 'ASSIGNED').length;
      const completed = result.filter((a) => a.status === 'COMPLETED').length;
      const avgScore =
        result.length > 0
          ? Math.round(result.reduce((sum, a) => sum + a.priorityScore, 0) / result.length)
          : 0;
      setStats({ total: result.length, assigned, completed, avgScore });
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (hasActiveFilters || page !== 0) return;

    const unsub1 = subscribe('allocation:new', fetchAllocations);
    const unsub2 = subscribe('allocation:completed', fetchAllocations);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, hasActiveFilters, page, fetchAllocations]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atamalar</h1>
          <p className="text-sm text-muted-foreground">Tum atamalari goruntuleyin ve yonetin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Toplam Atama</div>
            <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Aktif</div>
            <div className="text-3xl font-bold text-purple-600">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Tamamlanan</div>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Ort. Skor</div>
            <div className="text-3xl font-bold text-[#0065a1]">{stats.avgScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtreler:</span>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, status: v === 'all' ? '' : v });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Durumlar</SelectItem>
                <SelectItem value="ASSIGNED">Aktif</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandi</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.urgency || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, urgency: v === 'all' ? '' : v });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Oncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Oncelikler</SelectItem>
                <SelectItem value="HIGH">Yuksek</SelectItem>
                <SelectItem value="MEDIUM">Orta</SelectItem>
                <SelectItem value="LOW">Dusuk</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ status: '', urgency: '' });
                  setPage(0);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allocations Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Atama Listesi
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Filtrelenmis
                </Badge>
              )}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{total.toLocaleString()} kayit</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium">Zaman</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Kullanici</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Servis</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Talep Turu</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Oncelik</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Skor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Kaynak</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allocations.map((allocation) => (
                  <tr
                    key={allocation.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedAllocation(allocation)}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(allocation.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="text-sm font-medium">{allocation.request.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.request.user.city}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-xs">
                        {allocation.request.service}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm max-w-[150px] truncate">
                      {allocation.request.requestType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${URGENCY_COLORS[allocation.request.urgency]}`}
                        />
                        <span className="text-xs">
                          {URGENCY_LABELS[allocation.request.urgency]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-bold text-[#0065a1]">{allocation.priorityScore}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="text-sm">{allocation.resource.city}</p>
                        <p className="text-xs text-muted-foreground">{allocation.resourceId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={`${STATUS_COLORS[allocation.status]?.bg} ${STATUS_COLORS[allocation.status]?.text} text-xs`}
                      >
                        {STATUS_LABELS[allocation.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Atama bulunamadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Sayfa {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Onceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Sonraki
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Allocation Detail Modal */}
      {selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedAllocation.status === 'COMPLETED' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-purple-500" />
                  )}
                  <CardTitle>Atama Detayi</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAllocation(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status & Score */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Badge
                  className={`${STATUS_COLORS[selectedAllocation.status]?.bg} ${STATUS_COLORS[selectedAllocation.status]?.text}`}
                >
                  {STATUS_LABELS[selectedAllocation.status]}
                </Badge>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Oncelik Skoru</p>
                  <p className="text-2xl font-bold text-[#0065a1]">
                    {selectedAllocation.priorityScore}
                  </p>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Zaman:</span>
                <span>{new Date(selectedAllocation.timestamp).toLocaleString('tr-TR')}</span>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kullanici</p>
                  <p className="font-medium">{selectedAllocation.request.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAllocation.request.user.city}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kaynak</p>
                  <p className="font-medium">{selectedAllocation.resource.city}</p>
                  <p className="text-sm text-muted-foreground">{selectedAllocation.resourceId}</p>
                </div>
              </div>

              {/* Request Info */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Servis</span>
                  <Badge variant="outline">{selectedAllocation.request.service}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Talep Turu</span>
                  <span className="text-sm">
                    {selectedAllocation.request.requestType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Oncelik</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${URGENCY_COLORS[selectedAllocation.request.urgency]}`}
                    />
                    <span className="text-sm">
                      {URGENCY_LABELS[selectedAllocation.request.urgency]}
                    </span>
                  </div>
                </div>
              </div>

              {/* IDs */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>
                  <strong>Allocation ID:</strong> {selectedAllocation.id}
                </p>
                <p>
                  <strong>Request ID:</strong> {selectedAllocation.requestId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
