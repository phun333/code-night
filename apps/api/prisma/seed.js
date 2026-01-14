"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Clear existing data
    await prisma.allocation.deleteMany();
    await prisma.request.deleteMany();
    await prisma.systemLog.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
    await prisma.allocationRule.deleteMany();
    // Seed Admin User (only admin has password for login)
    await prisma.user.create({
        data: {
            id: 'ADMIN1',
            name: 'Admin Turkcell',
            email: 'admin@turkcell.com',
            password: 'admin123',
            city: 'Istanbul',
            role: 'ADMIN',
        },
    });
    console.log('Seeded 1 admin user');
    // Seed 100 regular users (no password needed - they don't login)
    const turkishNames = [
        'Ahmet',
        'Mehmet',
        'Ali',
        'Mustafa',
        'Hasan',
        'Huseyin',
        'Ibrahim',
        'Ismail',
        'Yusuf',
        'Osman',
        'Emre',
        'Can',
        'Baris',
        'Burak',
        'Cem',
        'Deniz',
        'Eren',
        'Fatih',
        'Gokhan',
        'Hakan',
        'Kemal',
        'Levent',
        'Murat',
        'Nihat',
        'Onur',
        'Ozgur',
        'Serkan',
        'Tamer',
        'Ugur',
        'Volkan',
        'Ayse',
        'Fatma',
        'Zeynep',
        'Elif',
        'Merve',
        'Busra',
        'Esra',
        'Seda',
        'Derya',
        'Ceren',
        'Gul',
        'Hande',
        'Ipek',
        'Melis',
        'Naz',
        'Pinar',
        'Sibel',
        'Tugba',
        'Yasemin',
        'Zehra',
    ];
    const turkishSurnames = [
        'Yilmaz',
        'Kaya',
        'Demir',
        'Celik',
        'Sahin',
        'Yildiz',
        'Yildirim',
        'Ozturk',
        'Aydin',
        'Ozdemir',
        'Arslan',
        'Dogan',
        'Kilic',
        'Aslan',
        'Cetin',
        'Kara',
        'Koc',
        'Kurt',
        'Ozkan',
        'Simsek',
    ];
    const cities = ['Istanbul', 'Ankara', 'Izmir'];
    const users = [];
    for (let i = 1; i <= 100; i++) {
        const firstName = turkishNames[Math.floor(Math.random() * turkishNames.length)];
        const lastName = turkishSurnames[Math.floor(Math.random() * turkishSurnames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        users.push({
            id: `USER-${i.toString().padStart(3, '0')}`,
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            city: city,
            role: 'USER',
        });
    }
    for (const user of users) {
        await prisma.user.create({ data: user });
    }
    console.log(`Seeded ${users.length} regular users`);
    // Seed Resources - 6 kisi toplam (2 Istanbul, 2 Ankara, 2 Izmir)
    const resources = [
        {
            id: 'RES-IST',
            resourceType: 'SUPPORT_TEAM',
            capacity: 2,
            city: 'Istanbul',
            status: 'AVAILABLE',
        },
        {
            id: 'RES-ANK',
            resourceType: 'SUPPORT_TEAM',
            capacity: 2,
            city: 'Ankara',
            status: 'AVAILABLE',
        },
        {
            id: 'RES-IZM',
            resourceType: 'SUPPORT_TEAM',
            capacity: 2,
            city: 'Izmir',
            status: 'AVAILABLE',
        },
    ];
    for (const resource of resources) {
        await prisma.resource.create({ data: resource });
    }
    console.log(`Seeded ${resources.length} resources`);
    // Seed AllocationRules - All weights in one table
    const allocationRules = [
        // Urgency weights
        {
            name: 'Yuksek Oncelik',
            category: 'URGENCY',
            key: 'HIGH',
            weight: 50,
            isActive: true,
            description: 'Acil talepler icin yuksek agirlik',
        },
        {
            name: 'Orta Oncelik',
            category: 'URGENCY',
            key: 'MEDIUM',
            weight: 30,
            isActive: true,
            description: 'Normal oncelikli talepler',
        },
        {
            name: 'Dusuk Oncelik',
            category: 'URGENCY',
            key: 'LOW',
            weight: 10,
            isActive: true,
            description: 'Dusuk oncelikli talepler',
        },
        // Service weights
        {
            name: 'Superonline',
            category: 'SERVICE',
            key: 'Superonline',
            weight: 20,
            isActive: true,
            description: 'Superonline servisi',
        },
        {
            name: 'Paycell',
            category: 'SERVICE',
            key: 'Paycell',
            weight: 10,
            isActive: true,
            description: 'Paycell servisi',
        },
        {
            name: 'TV+',
            category: 'SERVICE',
            key: 'TV+',
            weight: 5,
            isActive: true,
            description: 'TV+ servisi',
        },
        // Waiting time bonus
        {
            name: 'Bekleme Bonusu',
            category: 'WAITING_TIME',
            key: 'BONUS_PER_SECOND',
            weight: 2,
            isActive: true,
            description: 'Her saniye +2 puan',
        },
        // Request Types - Superonline
        {
            name: 'Baglanti Sorunu',
            category: 'REQUEST_TYPE',
            key: 'CONNECTION_ISSUE',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Hiz Sikayeti',
            category: 'REQUEST_TYPE',
            key: 'SPEED_COMPLAINT',
            weight: 0,
            isActive: true,
        },
        {
            name: 'Modem Problemi',
            category: 'REQUEST_TYPE',
            key: 'MODEM_PROBLEM',
            weight: 0,
            isActive: true,
        },
        {
            name: 'Kurulum Talebi',
            category: 'REQUEST_TYPE',
            key: 'INSTALLATION_REQUEST',
            weight: 0,
            isActive: true,
        },
        {
            name: 'Hat Kesintisi',
            category: 'REQUEST_TYPE',
            key: 'LINE_CUT',
            weight: 10,
            isActive: true,
        },
        { name: 'IP Sorunu', category: 'REQUEST_TYPE', key: 'IP_PROBLEM', weight: 0, isActive: true },
        { name: 'DNS Sorunu', category: 'REQUEST_TYPE', key: 'DNS_ISSUE', weight: 0, isActive: true },
        {
            name: 'Fiber Hasar',
            category: 'REQUEST_TYPE',
            key: 'FIBER_DAMAGE',
            weight: 15,
            isActive: true,
        },
        // Request Types - Paycell
        {
            name: 'Odeme Sorunu',
            category: 'REQUEST_TYPE',
            key: 'PAYMENT_PROBLEM',
            weight: 10,
            isActive: true,
        },
        {
            name: 'Islem Basarisiz',
            category: 'REQUEST_TYPE',
            key: 'TRANSACTION_FAILED',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Iade Talebi',
            category: 'REQUEST_TYPE',
            key: 'REFUND_REQUEST',
            weight: 5,
            isActive: true,
        },
        { name: 'Kart Sorunu', category: 'REQUEST_TYPE', key: 'CARD_ISSUE', weight: 0, isActive: true },
        {
            name: 'Bakiye Hatasi',
            category: 'REQUEST_TYPE',
            key: 'BALANCE_ERROR',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Uye Isyeri Sorunu',
            category: 'REQUEST_TYPE',
            key: 'MERCHANT_PROBLEM',
            weight: 0,
            isActive: true,
        },
        // Request Types - TV+
        {
            name: 'Yayin Sorunu',
            category: 'REQUEST_TYPE',
            key: 'STREAMING_ISSUE',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Kanal Eksik',
            category: 'REQUEST_TYPE',
            key: 'CHANNEL_MISSING',
            weight: 0,
            isActive: true,
        },
        {
            name: 'Altyazi Sorunu',
            category: 'REQUEST_TYPE',
            key: 'SUBTITLE_PROBLEM',
            weight: 0,
            isActive: true,
        },
        {
            name: 'Uygulama Cokmesi',
            category: 'REQUEST_TYPE',
            key: 'APP_CRASH',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Giris Sorunu',
            category: 'REQUEST_TYPE',
            key: 'LOGIN_ISSUE',
            weight: 5,
            isActive: true,
        },
        {
            name: 'Kalite Sorunu',
            category: 'REQUEST_TYPE',
            key: 'QUALITY_PROBLEM',
            weight: 0,
            isActive: true,
        },
        // Custom rules (example)
        {
            name: 'VIP Musteri Bonusu',
            category: 'CUSTOM',
            key: null,
            condition: "city == 'Istanbul'",
            weight: 5,
            isActive: false,
            description: 'Istanbul musterilerine ek oncelik',
        },
    ];
    for (const rule of allocationRules) {
        await prisma.allocationRule.create({ data: rule });
    }
    console.log(`Seeded ${allocationRules.length} allocation rules`);
    // NO requests or allocations - they will be created by the automation system
    console.log('Seeding completed! Start automation to begin the demo.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
