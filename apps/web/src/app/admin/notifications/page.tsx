'use client';

import { Bell, ChevronLeft, ChevronRight, Clock, MessageSquare, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

interface NotificationLog {
  id: string;
  eventType: string;
  eventData: {
    user_id: string;
    user_name: string;
    channel: string;
    message: string;
    service?: string;
    request_type?: string;
  };
  entityType: string;
  entityId: string;
  timestamp: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null);
  const { subscribe } = useWebSocket();
  const limit = 50;

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());

      const result = await fetchAPI<{ notifications: NotificationLog[]; total: number }>(
        `/api/notifications?${params}`,
      );
      setNotifications(result.notifications);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // Only subscribe to live updates on first page
    if (page !== 0) return;

    const unsub1 = subscribe('allocation:new', fetchNotifications);
    const unsub2 = subscribe('log:new', fetchNotifications);
    return () => {
      unsub1();
      unsub2();
    };
  }, [subscribe, page, fetchNotifications]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
          <h1 className="text-2xl font-bold">Bildirimler (BiP Mock)</h1>
          <p className="text-sm text-muted-foreground">
            Kullanicilara gonderilen tum mock bildirimlerin kaydi
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <MessageSquare className="w-3 h-3 mr-1" />
          Mock Sistem
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Toplam Bildirim</div>
            <div className="text-3xl font-bold">{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Kanal</div>
            <div className="text-2xl font-bold text-[#0065a1]">BiP</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Durum</div>
            <Badge className="bg-green-100 text-green-800 mt-1">Tumu Gonderildi</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Bildirim Loglari
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString()} kayit ({page * limit + 1}-
              {Math.min((page + 1) * limit, total)})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium">Zaman</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Kullanici</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Kanal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Mesaj</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Servis</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="text-sm font-medium">{notification.eventData.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.eventData.user_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {notification.eventData.channel}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm max-w-[300px] truncate">
                      {notification.eventData.message}
                    </td>
                    <td className="px-4 py-2">
                      {notification.eventData.service && (
                        <Badge variant="secondary" className="text-xs">
                          {notification.eventData.service}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Henuz bildirim yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {(() => {
        const totalPages = Math.ceil(total / limit);
        return totalPages > 1 ? (
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
        ) : null;
      })()}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>Bildirim Detayi</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Zaman:</span>
                <span>{new Date(selectedNotification.timestamp).toLocaleString('tr-TR')}</span>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kullanici</p>
                  <p className="font-medium">{selectedNotification.eventData.user_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedNotification.eventData.user_id}
                  </code>
                </div>
              </div>

              {/* Channel & Service */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kanal</p>
                  <Badge className="bg-blue-100 text-blue-800 mt-1">
                    {selectedNotification.eventData.channel}
                  </Badge>
                </div>
                {selectedNotification.eventData.service && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Servis</p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedNotification.eventData.service}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mesaj</p>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedNotification.eventData.message}
                </p>
              </div>

              {/* JSON Preview */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">JSON Payload</p>
                <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto">
                  {JSON.stringify(
                    {
                      user_id: selectedNotification.eventData.user_id,
                      message: selectedNotification.eventData.message,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
