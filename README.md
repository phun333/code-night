# Turkcell Smart Allocation

Dinamik Kaynak ve Öncelik Yönetim Platformu - Hackathon 2026

## Gereksinimler

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Hızlı Başlangıç

```bash
# 1. Repo'yu clone'la
git clone <repo-url>
cd code-night

# 2. Dependencies kur
pnpm install

# 3. PostgreSQL başlat
docker-compose up -d

# 4. Veritabanını hazırla
pnpm --filter api prisma db push
pnpm --filter api prisma db seed

# 5. Çalıştır
pnpm dev
```

## Erişim

| Servis | URL |
|--------|-----|
| Web Dashboard | http://localhost:3000 |
| API | http://localhost:3001 |

## iOS Ekibi İçin

Backend çalıştıktan sonra şu API'leri kullanabilirsiniz:

### Base URL
```
http://localhost:3001/api
```

### Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/requests` | Tüm talepleri listele |
| POST | `/requests` | Yeni talep oluştur |
| GET | `/resources` | Kaynakları listele |
| POST | `/allocations` | Talep ata |
| POST | `/allocations/auto` | Otomatik atama |
| GET | `/allocations` | Atamaları listele |
| GET | `/dashboard/summary` | Dashboard özeti |
| GET | `/rules` | Kuralları listele |
| GET | `/auth/users` | Kullanıcıları listele |

### Örnek: Yeni Talep Oluştur

```bash
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1",
    "service": "Superonline",
    "requestType": "CONNECTION_ISSUE",
    "urgency": "HIGH"
  }'
```

### Örnek Response:

```json
{
  "id": "cm5xi...",
  "userId": "U1",
  "service": "Superonline",
  "requestType": "CONNECTION_ISSUE",
  "urgency": "HIGH",
  "status": "PENDING",
  "createdAt": "2026-01-14T...",
  "priorityScore": 70
}
```

### WebSocket (Real-time)

```
ws://localhost:3001
```

Events:
- `request:new` - Yeni talep geldi
- `allocation:new` - Yeni atama yapıldı
- `resource:updated` - Kaynak güncellendi
- `dashboard:refresh` - Dashboard yenilenmeli

## Proje Yapısı

```
code-night/
├── apps/
│   ├── api/          # Express.js Backend
│   ├── web/          # Next.js Dashboard
│   └── ios/          # Swift App (siz dolduracaksınız)
├── packages/
│   └── shared/       # Ortak tipler
├── seed-data/        # Test verileri
└── docker-compose.yml
```

## Mevcut Kullanıcılar (Test)

| ID | İsim | Şehir |
|----|------|-------|
| U1 | Ayşe | Istanbul |
| U2 | Ali | Ankara |
| U3 | Deniz | Izmir |
| U4 | Mert | Bursa |

## Servisler

- Superonline
- Paycell
- TV+

## Urgency Seviyeleri

- HIGH (50 puan)
- MEDIUM (30 puan)
- LOW (10 puan)
