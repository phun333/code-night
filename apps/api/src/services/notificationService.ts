import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock BiP bildirim - SystemLog'a kayıt atar
export async function sendAllocationNotification(
  userId: string,
  userName: string,
  service: string,
  requestType: string,
) {
  const message = `Talebiniz oncelikli olarak isleme alindi. ${
    requestType.includes('CONNECTION') || requestType.includes('SPEED')
      ? 'Teknik ekip yonlendirildi.'
      : 'Destek ekibi yonlendirildi.'
  }`;

  // SystemLog'a kaydet
  await prisma.systemLog.create({
    data: {
      eventType: 'NOTIFICATION_SENT',
      entityType: 'USER',
      entityId: userId,
      eventData: {
        user_id: userId,
        user_name: userName,
        channel: 'BiP',
        message: message,
        service: service,
        request_type: requestType,
      },
    },
  });

  console.log(`[BiP Mock] Bildirim gonderildi: ${userName} - ${message}`);
}

// Tamamlanma bildirimi
export async function sendCompletionNotification(userId: string, userName: string) {
  const message =
    'Talebiniz basariyla tamamlandi. Hizmetimizden memnun kaldiysaniz bizi degerlendirin.';

  await prisma.systemLog.create({
    data: {
      eventType: 'NOTIFICATION_SENT',
      entityType: 'USER',
      entityId: userId,
      eventData: {
        user_id: userId,
        user_name: userName,
        channel: 'BiP',
        message: message,
      },
    },
  });

  console.log(`[BiP Mock] Tamamlanma bildirimi: ${userName} - ${message}`);
}
