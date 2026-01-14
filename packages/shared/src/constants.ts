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

// Request types
export const REQUEST_TYPES = [
  'CONNECTION_ISSUE',
  'PAYMENT_PROBLEM',
  'STREAMING_ISSUE',
  'SPEED_COMPLAINT',
] as const;

// Urgencies
export const URGENCIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

// Cities
export const CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Bursa'] as const;
