// Urgency weights
export const URGENCY_WEIGHTS = {
  HIGH: 50,
  MEDIUM: 30,
  LOW: 10,
} as const;

// Service weights
export const SERVICE_WEIGHTS = {
  Superonline: 20,
  Paycell: 10,
  'TV+': 5,
} as const;

// Waiting time bonus (points per 10 minutes)
export const WAITING_TIME_BONUS_PER_10_MIN = 5;

// Services
export const SERVICES = ['Superonline', 'Paycell', 'TV+'] as const;

// Request types (20 farklı tür)
export const REQUEST_TYPES = [
  // Superonline (8)
  'CONNECTION_ISSUE',
  'SPEED_COMPLAINT',
  'MODEM_PROBLEM',
  'INSTALLATION_REQUEST',
  'LINE_CUT',
  'IP_PROBLEM',
  'DNS_ISSUE',
  'FIBER_DAMAGE',
  // Paycell (6)
  'PAYMENT_PROBLEM',
  'TRANSACTION_FAILED',
  'REFUND_REQUEST',
  'CARD_ISSUE',
  'BALANCE_ERROR',
  'MERCHANT_PROBLEM',
  // TV+ (6)
  'STREAMING_ISSUE',
  'CHANNEL_MISSING',
  'SUBTITLE_PROBLEM',
  'APP_CRASH',
  'LOGIN_ISSUE',
  'QUALITY_PROBLEM',
] as const;

// Request type to service mapping
export const REQUEST_TYPE_SERVICE_MAP: Record<string, string> = {
  // Superonline
  CONNECTION_ISSUE: 'Superonline',
  SPEED_COMPLAINT: 'Superonline',
  MODEM_PROBLEM: 'Superonline',
  INSTALLATION_REQUEST: 'Superonline',
  LINE_CUT: 'Superonline',
  IP_PROBLEM: 'Superonline',
  DNS_ISSUE: 'Superonline',
  FIBER_DAMAGE: 'Superonline',
  // Paycell
  PAYMENT_PROBLEM: 'Paycell',
  TRANSACTION_FAILED: 'Paycell',
  REFUND_REQUEST: 'Paycell',
  CARD_ISSUE: 'Paycell',
  BALANCE_ERROR: 'Paycell',
  MERCHANT_PROBLEM: 'Paycell',
  // TV+
  STREAMING_ISSUE: 'TV+',
  CHANNEL_MISSING: 'TV+',
  SUBTITLE_PROBLEM: 'TV+',
  APP_CRASH: 'TV+',
  LOGIN_ISSUE: 'TV+',
  QUALITY_PROBLEM: 'TV+',
};

// Request type labels (Türkçe)
export const REQUEST_TYPE_LABELS: Record<string, string> = {
  CONNECTION_ISSUE: 'Bağlantı Sorunu',
  SPEED_COMPLAINT: 'Hız Şikayeti',
  MODEM_PROBLEM: 'Modem Problemi',
  INSTALLATION_REQUEST: 'Kurulum Talebi',
  LINE_CUT: 'Hat Kesintisi',
  IP_PROBLEM: 'IP Sorunu',
  DNS_ISSUE: 'DNS Sorunu',
  FIBER_DAMAGE: 'Fiber Hasar',
  PAYMENT_PROBLEM: 'Ödeme Sorunu',
  TRANSACTION_FAILED: 'İşlem Başarısız',
  REFUND_REQUEST: 'İade Talebi',
  CARD_ISSUE: 'Kart Sorunu',
  BALANCE_ERROR: 'Bakiye Hatası',
  MERCHANT_PROBLEM: 'Üye İşyeri Sorunu',
  STREAMING_ISSUE: 'Yayın Sorunu',
  CHANNEL_MISSING: 'Kanal Eksik',
  SUBTITLE_PROBLEM: 'Altyazı Sorunu',
  APP_CRASH: 'Uygulama Çökmesi',
  LOGIN_ISSUE: 'Giriş Sorunu',
  QUALITY_PROBLEM: 'Kalite Sorunu',
};

// Event types for logging
export const EVENT_TYPES = [
  'REQUEST_CREATED',
  'REQUEST_QUEUED',
  'ALLOCATION_ASSIGNED',
  'ALLOCATION_COMPLETED',
  'RESOURCE_BUSY',
  'RESOURCE_AVAILABLE',
  'SCORE_CALCULATED',
  'AUTOMATION_STARTED',
  'AUTOMATION_STOPPED',
  'AUTOMATION_CYCLE',
] as const;

// Urgencies
export const URGENCIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

// Cities
export const CITIES = ['Istanbul', 'Ankara'] as const;
