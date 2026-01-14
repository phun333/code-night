import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Turkcell Kaynak Tahsis API',
      version: '1.0.0',
      description: `
## Akıllı Kaynak Tahsis Sistemi

Bu API, Turkcell hizmetleri (Superonline, Paycell, TV+) için destek taleplerini yönetir ve kaynakları akıllı bir şekilde tahsis eder.

### Özellikler:
- **Öncelik Tabanlı Tahsis**: Aciliyet, hizmet tipi ve bekleme süresine göre otomatik önceliklendirme
- **Gerçek Zamanlı Güncellemeler**: WebSocket üzerinden anlık bildirimler
- **Kural Tabanlı Sistem**: Özelleştirilebilir tahsis kuralları
- **Dashboard Analytics**: Kapsamlı metrikler ve istatistikler

### WebSocket Events:
- \`request:new\` - Yeni talep oluşturuldu
- \`allocation:new\` - Yeni tahsis yapıldı
- \`resource:updated\` - Kaynak durumu güncellendi
- \`dashboard:refresh\` - Dashboard yenilemesi gerekiyor
      `,
      contact: {
        name: 'Code Night 2026 Team',
      },
    },
    servers: [
      {
        url: 'https://api.codenight.aliselvet.xyz',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development Server',
      },
    ],
    tags: [
      { name: 'Requests', description: 'Destek talepleri yönetimi' },
      { name: 'Resources', description: 'Kaynak yönetimi' },
      { name: 'Allocations', description: 'Tahsis işlemleri' },
      { name: 'Rules', description: 'Tahsis kuralları' },
      { name: 'Dashboard', description: 'Dashboard ve istatistikler' },
      { name: 'Auth', description: 'Kimlik doğrulama' },
      { name: 'Health', description: 'Sistem sağlık kontrolü' },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'U1' },
            name: { type: 'string', example: 'Ayşe Yılmaz' },
            city: { type: 'string', example: 'Istanbul' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clr1abc123' },
            userId: { type: 'string', example: 'U1' },
            service: { type: 'string', enum: ['Superonline', 'Paycell', 'TV+'], example: 'Superonline' },
            requestType: {
              type: 'string',
              enum: ['CONNECTION_ISSUE', 'PAYMENT_PROBLEM', 'STREAMING_ISSUE', 'SPEED_COMPLAINT'],
              example: 'CONNECTION_ISSUE',
            },
            urgency: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'HIGH' },
            status: { type: 'string', enum: ['PENDING', 'ASSIGNED', 'COMPLETED'], example: 'PENDING' },
            createdAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
            priorityScore: { type: 'integer', example: 85 },
          },
        },
        CreateRequest: {
          type: 'object',
          required: ['userId', 'service', 'requestType', 'urgency'],
          properties: {
            userId: { type: 'string', example: 'U1' },
            service: { type: 'string', enum: ['Superonline', 'Paycell', 'TV+'] },
            requestType: {
              type: 'string',
              enum: ['CONNECTION_ISSUE', 'PAYMENT_PROBLEM', 'STREAMING_ISSUE', 'SPEED_COMPLAINT'],
            },
            urgency: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          },
        },
        Resource: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'R1' },
            resourceType: { type: 'string', enum: ['TECH_TEAM', 'SUPPORT_AGENT'], example: 'TECH_TEAM' },
            capacity: { type: 'integer', example: 5 },
            city: { type: 'string', example: 'Istanbul' },
            status: { type: 'string', enum: ['AVAILABLE', 'BUSY'], example: 'AVAILABLE' },
            activeAllocations: { type: 'integer', example: 2 },
            utilization: { type: 'integer', description: 'Yüzde olarak kullanım oranı', example: 40 },
          },
        },
        Allocation: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clr2xyz789' },
            requestId: { type: 'string' },
            resourceId: { type: 'string' },
            priorityScore: { type: 'integer', example: 85 },
            status: { type: 'string', enum: ['ASSIGNED', 'COMPLETED'], example: 'ASSIGNED' },
            timestamp: { type: 'string', format: 'date-time' },
            request: { $ref: '#/components/schemas/Request' },
            resource: { $ref: '#/components/schemas/Resource' },
          },
        },
        AllocationRule: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clr3rule456' },
            condition: { type: 'string', example: "urgency == 'HIGH'" },
            weight: { type: 'integer', example: 20 },
            isActive: { type: 'boolean', example: true },
          },
        },
        CreateRule: {
          type: 'object',
          required: ['condition', 'weight'],
          properties: {
            condition: { type: 'string', example: "service == 'Superonline'" },
            weight: { type: 'integer', example: 15 },
            isActive: { type: 'boolean', default: true },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                pendingRequests: { type: 'integer' },
                activeAllocations: { type: 'integer' },
                completedAllocations: { type: 'integer' },
                totalResources: { type: 'integer' },
              },
            },
            resourceUtilization: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resourceId: { type: 'string' },
                  resourceType: { type: 'string' },
                  city: { type: 'string' },
                  capacity: { type: 'integer' },
                  used: { type: 'integer' },
                  percentage: { type: 'integer' },
                  status: { type: 'string' },
                },
              },
            },
            recentAllocations: {
              type: 'array',
              items: { $ref: '#/components/schemas/Allocation' },
            },
            priorityQueue: {
              type: 'array',
              items: { $ref: '#/components/schemas/Request' },
            },
            breakdown: {
              type: 'object',
              properties: {
                byUrgency: { type: 'array', items: { type: 'object' } },
                byService: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Sistem sağlık kontrolü',
          description: 'API sunucusunun çalışıp çalışmadığını kontrol eder',
          responses: {
            200: {
              description: 'Sunucu çalışıyor',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/requests': {
        get: {
          tags: ['Requests'],
          summary: 'Tüm talepleri listele',
          description: 'Filtreleme seçenekleriyle birlikte tüm destek taleplerini getirir',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ASSIGNED', 'COMPLETED'] }, description: 'Duruma göre filtrele' },
            { name: 'urgency', in: 'query', schema: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] }, description: 'Aciliyete göre filtrele' },
            { name: 'service', in: 'query', schema: { type: 'string', enum: ['Superonline', 'Paycell', 'TV+'] }, description: 'Hizmete göre filtrele' },
          ],
          responses: {
            200: {
              description: 'Talep listesi',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Request' } } } },
            },
            500: { description: 'Sunucu hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Requests'],
          summary: 'Yeni talep oluştur',
          description: 'Yeni bir destek talebi oluşturur. WebSocket üzerinden `request:new` eventi yayınlanır.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRequest' } } },
          },
          responses: {
            201: { description: 'Talep oluşturuldu', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
            400: { description: 'Geçersiz veri', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            500: { description: 'Sunucu hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/requests/{id}': {
        get: {
          tags: ['Requests'],
          summary: 'Tek talep getir',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Talep ID' }],
          responses: {
            200: { description: 'Talep detayı', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
            404: { description: 'Talep bulunamadı', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        patch: {
          tags: ['Requests'],
          summary: 'Talep durumunu güncelle',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['PENDING', 'ASSIGNED', 'COMPLETED'] } } } } },
          },
          responses: {
            200: { description: 'Güncellendi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
            500: { description: 'Sunucu hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/resources': {
        get: {
          tags: ['Resources'],
          summary: 'Tüm kaynakları listele',
          description: 'Kullanım oranları ile birlikte tüm kaynakları getirir',
          parameters: [
            { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Şehre göre filtrele' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'BUSY'] }, description: 'Duruma göre filtrele' },
          ],
          responses: {
            200: { description: 'Kaynak listesi', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Resource' } } } } },
          },
        },
      },
      '/api/resources/{id}': {
        get: {
          tags: ['Resources'],
          summary: 'Tek kaynak getir',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Kaynak detayı', content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } } },
            404: { description: 'Kaynak bulunamadı' },
          },
        },
        patch: {
          tags: ['Resources'],
          summary: 'Kaynağı güncelle',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['AVAILABLE', 'BUSY'] },
                    capacity: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Güncellendi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Resource' } } } },
          },
        },
      },
      '/api/allocations': {
        get: {
          tags: ['Allocations'],
          summary: 'Tüm tahsisleri listele',
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['ASSIGNED', 'COMPLETED'] } }],
          responses: {
            200: { description: 'Tahsis listesi', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Allocation' } } } } },
          },
        },
        post: {
          tags: ['Allocations'],
          summary: 'Talep tahsis et',
          description: 'Belirli bir talebi uygun bir kaynağa tahsis eder',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['requestId'], properties: { requestId: { type: 'string' } } } } },
          },
          responses: {
            201: {
              description: 'Tahsis başarılı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      allocation: { $ref: '#/components/schemas/Allocation' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: { description: 'Tahsis yapılamadı (kaynak yok veya talep zaten tahsis edilmiş)' },
          },
        },
      },
      '/api/allocations/auto': {
        post: {
          tags: ['Allocations'],
          summary: 'Otomatik tahsis',
          description: 'Tüm bekleyen talepleri öncelik sırasına göre otomatik olarak tahsis eder',
          responses: {
            200: {
              description: 'Otomatik tahsis sonucu',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Auto-allocation complete: 5 successful, 2 queued/failed' },
                      results: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/allocations/{id}': {
        patch: {
          tags: ['Allocations'],
          summary: 'Tahsis durumunu güncelle',
          description: 'Tahsis tamamlandığında kaynak serbest bırakılır',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ASSIGNED', 'COMPLETED'] } } } } },
          },
          responses: {
            200: { description: 'Güncellendi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Allocation' } } } },
          },
        },
      },
      '/api/rules': {
        get: {
          tags: ['Rules'],
          summary: 'Tahsis kurallarını listele',
          parameters: [{ name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Aktif/pasif filtresi' }],
          responses: {
            200: { description: 'Kural listesi', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AllocationRule' } } } } },
          },
        },
        post: {
          tags: ['Rules'],
          summary: 'Yeni kural oluştur',
          description: 'Öncelik hesaplamasında kullanılacak yeni bir kural ekler',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRule' } } },
          },
          responses: {
            201: { description: 'Kural oluşturuldu', content: { 'application/json': { schema: { $ref: '#/components/schemas/AllocationRule' } } } },
            400: { description: 'Geçersiz veri' },
          },
        },
      },
      '/api/rules/{id}': {
        get: {
          tags: ['Rules'],
          summary: 'Tek kural getir',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Kural detayı', content: { 'application/json': { schema: { $ref: '#/components/schemas/AllocationRule' } } } },
            404: { description: 'Kural bulunamadı' },
          },
        },
        patch: {
          tags: ['Rules'],
          summary: 'Kuralı güncelle',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    condition: { type: 'string' },
                    weight: { type: 'integer' },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Güncellendi' } },
        },
        delete: {
          tags: ['Rules'],
          summary: 'Kuralı sil',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Silindi' } },
        },
      },
      '/api/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Dashboard özeti',
          description: 'Tüm sistem metrikleri, kaynak kullanımı, son tahsisler ve öncelik kuyruğunu getirir',
          responses: {
            200: { description: 'Dashboard verileri', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummary' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Giriş yap',
          description: 'Mock authentication - kullanıcı seçimi ile giriş',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', example: 'U1' } } } } },
          },
          responses: {
            200: {
              description: 'Giriş başarılı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string' },
                    },
                  },
                },
              },
            },
            404: { description: 'Kullanıcı bulunamadı' },
          },
        },
      },
      '/api/auth/users': {
        get: {
          tags: ['Auth'],
          summary: 'Kullanıcıları listele',
          description: 'Mock login için mevcut kullanıcıları getirir',
          responses: {
            200: { description: 'Kullanıcı listesi', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
