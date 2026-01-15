# Turkcell Smart Allocation




**Dinamik Kaynak ve Öncelik Yönetim Platformu**

*Turkcell Code Night 2026*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://typescriptlang.org/)



---

Müşteri taleplerini akıllı önceliklendirme algoritmaları ile analiz eden ve en uygun kaynaklara otomatik olarak atayan full-stack uygulama.

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Akıllı Önceliklendirme** | Aciliyet, servis tipi, talep türü ve bekleme süresine göre dinamik skor hesaplama |
| **Otomatik Kaynak Tahsisi** | Uygun kaynakları otomatik eşleştirme ve coğrafi öncelik desteği |
| **Gerçek Zamanlı Dashboard** | WebSocket ile anlık güncellemeler ve canlı izleme |
| **AI Destekli Kural Yönetimi** | Google Gemini ile doğal dil komutları |
| **Çoklu Servis Desteği** | Superonline, Paycell ve TV+ entegrasyonu |

## Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                         code-night/                             │
├─────────────────────────────────────────────────────────────────┤
│  apps/                                                          │
│  ├── web/          → Next.js 16 Dashboard         (Port 3000)   │
│  ├── api/          → Express.js Backend           (Port 3001)   │
│  ├── gemini/       → Google Gemini AI Servisi     (Port 3002)   │
│  └── ios/          → Swift iOS Uygulaması                       │
│                                                                 │
│  packages/                                                      │
│  └── shared/       → Ortak tipler ve sabitler                   │
└─────────────────────────────────────────────────────────────────┘
```

## Teknoloji Stack

<table>
<tr>
<td width="50%">

### Frontend
- **Framework:** Next.js 16, React 19
- **Styling:** Tailwind CSS
- **UI:** Radix UI, Lucide Icons
- **Charts:** Recharts
- **Real-time:** Socket.io Client

</td>
<td width="50%">

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 15
- **Docs:** Swagger

</td>
</tr>
<tr>
<td>

### AI & Real-time
- **AI:** Google Gemini 3.5 Flash
- **WebSocket:** Socket.io

</td>
<td>

### DevOps
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Container:** Docker
- **Linter:** Biome

</td>
</tr>
</table>

## Hızlı Başlangıç

### Gereksinimler

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) 9.15+ (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Kurulum

```bash
# 1. Bağımlılıkları yükle
pnpm install

# 2. PostgreSQL başlat
docker-compose up -d

# 3. Veritabanını hazırla
pnpm --filter api prisma db push
pnpm --filter api prisma db seed

# 4. Geliştirme sunucularını başlat
pnpm dev
```

### Erişim Noktaları

| Servis | URL | Açıklama |
|--------|-----|----------|
| Dashboard | http://localhost:3000/admin | Ana kontrol paneli |
| API | http://localhost:3001 | REST API |
| API Docs | http://localhost:3001/api-docs | Swagger dokümantasyonu |
| Gemini | http://localhost:3002 | AI servisi |
| WebSocket | ws://localhost:3001 | Real-time events |

## Komutlar

```bash
pnpm dev          # Tüm servisleri paralel başlat
pnpm build        # Production build
pnpm lint         # Kod kontrolü (Biome)
pnpm lint:fix     # Otomatik düzeltme
pnpm format       # Kod formatlama

# Veritabanı
pnpm db:studio    # Prisma Studio (görsel veritabanı)
pnpm db:migrate   # Migration oluştur/çalıştır
pnpm db:seed      # Test verileri yükle

# Docker
docker-compose up --build   # Tüm servisleri container olarak çalıştır
```

## Önceliklendirme Sistemi

Talepler çok faktörlü skor hesaplaması ile önceliklendirilir:

```
Toplam Skor = Aciliyet + Servis Ağırlığı + Talep Tipi + Bekleme Bonusu + Özel Kurallar
```

| Faktör | Değerler |
|--------|----------|
| **Aciliyet** | HIGH: 50, MEDIUM: 30, LOW: 10 puan |
| **Servis Tipi** | Superonline: 20, Paycell: 10, TV+: 5 puan |
| **Talep Türü** | 20 farklı tip, her birinin kendine özel ağırlığı |
| **Bekleme Süresi** | Dakika başına artan bonus puan |
| **Özel Kurallar** | AI ile yapılandırılabilir dinamik kurallar |

## API Referansı

### Base URL
```
http://localhost:3001/api
```

### Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/requests` | Tüm talepleri listele |
| `POST` | `/requests` | Yeni talep oluştur |
| `GET` | `/resources` | Kaynakları listele |
| `POST` | `/allocations` | Manuel talep ataması |
| `POST` | `/allocations/auto` | Otomatik atama |
| `GET` | `/allocations` | Atamaları listele |
| `GET` | `/dashboard/summary` | Dashboard metrikleri |
| `GET` | `/rules` | Önceliklendirme kuralları |
| `PATCH` | `/rules/:id` | Kural güncelle |
| `GET` | `/analytics` | Analitik verileri |
| `GET` | `/logs` | Sistem logları |
| `GET` | `/auth/users` | Kullanıcı listesi |

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

### Örnek Response

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

## WebSocket Events

```
ws://localhost:3001
```

| Event | Açıklama |
|-------|----------|
| `request:new` | Yeni talep oluşturuldu |
| `allocation:new` | Yeni atama yapıldı |
| `resource:updated` | Kaynak durumu değişti |
| `dashboard:refresh` | Dashboard yenilenmeli |

## Servisler ve Talep Tipleri

<details>
<summary><b>Superonline</b> (Internet/Fiber)</summary>

- `CONNECTION_ISSUE` - Bağlantı sorunu
- `SPEED_COMPLAINT` - Hız şikayeti
- `MODEM_PROBLEM` - Modem problemi
- `INSTALLATION_REQUEST` - Kurulum talebi
- `LINE_CUT` - Hat kesintisi
- `IP_PROBLEM` - IP sorunu
- `DNS_ISSUE` - DNS problemi
- `FIBER_DAMAGE` - Fiber hasar

</details>

<details>
<summary><b>Paycell</b> (Mobil Ödeme)</summary>

- `PAYMENT_PROBLEM` - Ödeme problemi
- `TRANSACTION_FAILED` - İşlem hatası
- `REFUND_REQUEST` - İade talebi
- `CARD_ISSUE` - Kart sorunu
- `BALANCE_ERROR` - Bakiye hatası
- `MERCHANT_PROBLEM` - Üye işyeri sorunu

</details>

<details>
<summary><b>TV+</b> (Streaming)</summary>

- `STREAMING_ISSUE` - Yayın sorunu
- `CHANNEL_MISSING` - Kanal eksikliği
- `SUBTITLE_PROBLEM` - Altyazı problemi
- `APP_CRASH` - Uygulama çökmesi
- `LOGIN_ISSUE` - Giriş sorunu
- `QUALITY_PROBLEM` - Kalite problemi

</details>

## Test Verileri

### Kullanıcılar

| ID | İsim | Şehir |
|----|------|-------|
| U1 | Ayşe | Istanbul |
| U2 | Ali | Ankara |
| U3 | Deniz | Izmir |
| U4 | Mert | Bursa |

### Aciliyet Seviyeleri

| Seviye | Puan | Renk |
|--------|------|------|
| HIGH | 50 | Kırmızı |
| MEDIUM | 30 | Sarı |
| LOW | 10 | Yeşil |

## Veritabanı Şeması

```
┌──────────┐     ┌───────────┐     ┌────────────┐
│   User   │────→│  Request  │────→│ Allocation │
└──────────┘     └───────────┘     └────────────┘
                                          │
┌───────────────┐    ┌──────────┐         │
│ AllocationRule│    │ Resource │←────────┘
└───────────────┘    └──────────┘

┌───────────┐
│ SystemLog │  → Tüm sistem olaylarını loglar
└───────────┘
```

## Proje Yapısı

```
code-night/
├── apps/
│   ├── api/                    # Express.js Backend
│   │   ├── src/
│   │   │   ├── routes/         # API endpoint'leri
│   │   │   └── services/       # İş mantığı
│   │   └── prisma/             # Veritabanı şeması
│   ├── web/                    # Next.js Dashboard
│   │   ├── src/
│   │   │   ├── app/admin/      # Admin sayfaları
│   │   │   └── components/     # UI bileşenleri
│   │   └── tailwind.config.ts  # Turkcell teması
│   ├── gemini/                 # AI Servisi
│   └── ios/                    # iOS Uygulaması
├── packages/
│   └── shared/                 # Ortak tipler
├── seed-data/                  # CSV test verileri
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```


<div align="center">

**Turkcell Code Night 2026**

</div>
