'use client';

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Pause,
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

interface Log {
  id: string;
  eventType: string;
  eventData: {
    message: string;
    details?: Record<string, any>;
  };
  entityType: string;
  entityId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  byEventType: { type: string; count: number }[];
  byEntityType: { type: string; count: number }[];
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  REQUEST_CREATED: { label: 'Yeni Talep', color: 'bg-blue-500' },
  REQUEST_QUEUED: { label: 'Kuyruga Alindi', color: 'bg-yellow-500' },
  ALLOCATION_ASSIGNED: { label: 'Atama Yapildi', color: 'bg-green-500' },
  ALLOCATION_COMPLETED: { label: 'Tamamlandi', color: 'bg-emerald-500' },
  RESOURCE_BUSY: { label: 'Kaynak Dolu', color: 'bg-red-500' },
  RESOURCE_AVAILABLE: { label: 'Kaynak Musait', color: 'bg-teal-500' },
  SCORE_CALCULATED: { label: 'Skor Hesaplandi', color: 'bg-cyan-500' },
  AUTOMATION_STARTED: { label: 'Sistem Basladi', color: 'bg-purple-500' },
  AUTOMATION_STOPPED: { label: 'Sistem Durdu', color: 'bg-gray-500' },
  AUTOMATION_CYCLE: { label: 'Dongu', color: 'bg-indigo-500' },
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  REQUEST: 'Talep',
  ALLOCATION: 'Atama',
  RESOURCE: 'Kaynak',
  SYSTEM: 'Sistem',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    eventType: '',
    entityType: '',
  });
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const { subscribe } = useWebSocket();
  const limit = 50;

  // Check if any filters are active
  const hasActiveFilters = filters.eventType || filters.entityType;

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.entityType) params.append('entityType', filters.entityType);

      const result = await fetchAPI<{ logs: Log[]; total: number }>(`/api/logs?${params}`);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await fetchAPI<LogStats>('/api/logs/stats');
      setStats(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    // Only subscribe to live updates if enabled AND no filters active AND on first page
    if (!liveUpdates || hasActiveFilters || page !== 0) return;

    const unsub = subscribe('log:new', () => {
      fetchLogs();
      fetchStats();
    });
    return () => unsub();
  }, [subscribe, liveUpdates, hasActiveFilters, page, fetchLogs, fetchStats]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/logs/export?format=${format}`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `allocations_${timestamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleExportDetailedJSON = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/logs/export/detailed`,
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `logs_detailed_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting detailed logs:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatFullTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sistem Loglari</h1>
          <p className="text-sm text-muted-foreground">Tum sistem olaylarinin detayli kaydi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Disa Aktar
          </Button>
        </div>
      </div>

      {/* Live Updates Warning */}
      {hasActiveFilters && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <Pause className="w-4 h-4" />
            <span className="text-sm">Filtre aktif - canli guncellemeler duraklatildi</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({ eventType: '', entityType: '' });
              setPage(0);
            }}
            className="text-yellow-800 hover:text-yellow-900"
          >
            Filtreleri Temizle
          </Button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Toplam Log</div>
              <div className="text-3xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Bugun</div>
              <div className="text-3xl font-bold text-green-600">
                +{stats.todayLogs.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Event Turleri</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.byEventType.slice(0, 4).map((e) => (
                  <Badge key={e.type} variant="outline" className="text-xs">
                    {EVENT_TYPE_LABELS[e.type]?.label || e.type}: {e.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Entity Turleri</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.byEntityType.map((e) => (
                  <Badge key={e.type} variant="outline" className="text-xs">
                    {ENTITY_TYPE_LABELS[e.type] || e.type}: {e.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtreler:</span>
            </div>
            <Select
              value={filters.eventType || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, eventType: v === 'all' ? '' : v });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Event Turu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tumu</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.entityType || 'all'}
              onValueChange={(v) => {
                setFilters({ ...filters, entityType: v === 'all' ? '' : v });
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Entity Turu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tumu</SelectItem>
                {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ eventType: '', entityType: '' });
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

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Log Listesi
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Filtrelenmis
                </Badge>
              )}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString()} kayit ({page * limit + 1}-
              {Math.min((page + 1) * limit, total)})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">Zaman</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Entity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Mesaj</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              EVENT_TYPE_LABELS[log.eventType]?.color || 'bg-gray-500'
                            }`}
                          />
                          <Badge variant="outline" className="text-xs">
                            {EVENT_TYPE_LABELS[log.eventType]?.label || log.eventType}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className="text-xs">
                          {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                        </Badge>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm max-w-[300px] truncate">
                        {log.eventData.message}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.eventData.details && JSON.stringify(log.eventData.details)}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Log bulunamadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Sayfa {page + 1} / {totalPages || 1}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Loglari Disa Aktar</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowExportModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Allocation verilerini farkli formatlarda indirin. Product ve Data Science ekipleri
                icin.
              </p>

              {/* Sample Format Preview */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-2">Ornek Format:</p>
                <pre className="text-xs overflow-auto">
                  {`{
  "allocation_id": "AL-001",
  "request_id": "REQ-2041",
  "resource_id": "RES-IST",
  "priority_score": 92,
  "status": "ASSIGNED",
  "timestamp": "2026-03-12T14:30:00Z"
}`}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* JSON Export */}
                <Card
                  className="p-4 hover:bg-muted/50 cursor-pointer border-2 hover:border-blue-500 transition-colors"
                  onClick={() => handleExport('json')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileJson className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">Temel allocation verileri</p>
                    </div>
                  </div>
                </Card>

                {/* CSV Export */}
                <Card
                  className="p-4 hover:bg-muted/50 cursor-pointer border-2 hover:border-green-500 transition-colors"
                  onClick={() => handleExport('csv')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-muted-foreground">Excel uyumlu tablo</p>
                    </div>
                  </div>
                </Card>

                {/* Detailed JSON for Data Science */}
                <Card
                  className="p-4 hover:bg-muted/50 cursor-pointer border-2 hover:border-indigo-500 transition-colors col-span-2"
                  onClick={handleExportDetailedJSON}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileDown className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">Detayli JSON (Data Science)</p>
                      <p className="text-xs text-muted-foreground">
                        Request, user, resource detaylari + summary istatistikler + aktif kurallar
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>JSON:</strong> allocation_id, request_id, resource_id, priority_score,
                  status, timestamp
                </p>
                <p>
                  <strong>Detayli:</strong> + request (service, urgency, wait_time), user (city),
                  resource (capacity), summary stats
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      EVENT_TYPE_LABELS[selectedLog.eventType]?.color || 'bg-gray-500'
                    }`}
                  />
                  <CardTitle>
                    {EVENT_TYPE_LABELS[selectedLog.eventType]?.label || selectedLog.eventType}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Zaman:</span>
                <span className="font-mono">{formatFullTime(selectedLog.timestamp)}</span>
              </div>

              {/* Entity Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity Turu</p>
                  <Badge variant="secondary" className="mt-1">
                    {ENTITY_TYPE_LABELS[selectedLog.entityType] || selectedLog.entityType}
                  </Badge>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                      {selectedLog.entityId}
                    </code>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mesaj</p>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedLog.eventData.message}</p>
              </div>

              {/* Details */}
              {selectedLog.eventData.details && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detaylar</p>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.eventData.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Metadata</p>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Copy JSON Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                }}
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON Olarak Kopyala
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
