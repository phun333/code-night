// Mock BiP Notification Service

interface Notification {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// In-memory notification store (mock)
const notifications: Notification[] = [];

export function sendNotification(userId: string, message: string): Notification {
  const notification: Notification = {
    id: `NOTIF-${Date.now()}`,
    userId,
    message,
    timestamp: new Date(),
    read: false,
  };

  notifications.push(notification);

  // Log for demo purposes
  console.log(`[BiP Mock] Notification sent to ${userId}: ${message}`);

  return notification;
}

export function getNotifications(userId: string): Notification[] {
  return notifications.filter((n) => n.userId === userId);
}

export function getAllNotifications(): Notification[] {
  return notifications;
}

export function markAsRead(notificationId: string): boolean {
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}
