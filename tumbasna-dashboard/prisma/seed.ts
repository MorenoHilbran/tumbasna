/**
 * Tumbasna — Database Seeder
 * Simulasi data realistis petani, pedagang, dan pencocokan komoditas pangan
 * di berbagai wilayah Indonesia.
 *
 * Jalankan: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const Role = {
    PETANI: 'PETANI',
    PEDAGANG: 'PEDAGANG',
} as const;
type Role = typeof Role[keyof typeof Role];

const EntryType = {
    SUPPLY: 'SUPPLY',
    DEMAND: 'DEMAND',
} as const;
type EntryType = typeof EntryType[keyof typeof EntryType];

const Status = {
    ACTIVE: 'ACTIVE',
    MATCHED: 'MATCHED',
    CLOSED: 'CLOSED',
} as const;
type Status = typeof Status[keyof typeof Status];

const MatchStatus = {
    PENDING: 'PENDING',
    MATCHED: 'MATCHED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;
type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

const prisma = new PrismaClient();

// ─── Master Data ──────────────────────────────────────────────────────────────

const COMMODITIES: { name: string; baseSupplyPrice: number; baseDemandPrice: number }[] = [
    { name: 'bawang merah', baseSupplyPrice: 18_000, baseDemandPrice: 24_000 },
    { name: 'cabai rawit', baseSupplyPrice: 35_000, baseDemandPrice: 48_000 },
    { name: 'cabai merah', baseSupplyPrice: 28_000, baseDemandPrice: 38_000 },
    { name: 'beras', baseSupplyPrice: 9_500, baseDemandPrice: 13_000 },
    { name: 'minyak goreng', baseSupplyPrice: 14_000, baseDemandPrice: 17_000 },
    { name: 'tomat', baseSupplyPrice: 8_000, baseDemandPrice: 12_000 },
    { name: 'kentang', baseSupplyPrice: 11_000, baseDemandPrice: 15_000 },
    { name: 'jagung', baseSupplyPrice: 4_500, baseDemandPrice: 6_500 },
    { name: 'kedelai', baseSupplyPrice: 9_000, baseDemandPrice: 12_500 },
    { name: 'bawang putih', baseSupplyPrice: 22_000, baseDemandPrice: 30_000 },
];

/** Indonesian locations with real lat/lng */
const SUPPLY_LOCATIONS: { location: string; lat: number; lng: number }[] = [
    // Jawa Barat
    { location: 'Garut, Jawa Barat', lat: -7.2167, lng: 107.9000 },
    { location: 'Cianjur, Jawa Barat', lat: -6.8208, lng: 107.1403 },
    { location: 'Tasikmalaya, Jawa Barat', lat: -7.3274, lng: 108.2207 },
    { location: 'Brebes, Jawa Tengah', lat: -6.8706, lng: 108.9254 },
    // Jawa Tengah
    { location: 'Purwokerto, Jawa Tengah', lat: -7.4214, lng: 109.2479 },
    { location: 'Wonosobo, Jawa Tengah', lat: -7.3614, lng: 109.9044 },
    { location: 'Magelang, Jawa Tengah', lat: -7.4690, lng: 110.2177 },
    { location: 'Temanggung, Jawa Tengah', lat: -7.3152, lng: 110.1676 },
    // Jawa Timur
    { location: 'Malang, Jawa Timur', lat: -7.9797, lng: 112.6304 },
    { location: 'Banyuwangi, Jawa Timur', lat: -8.2192, lng: 114.3695 },
    { location: 'Kediri, Jawa Timur', lat: -7.8167, lng: 112.0167 },
    { location: 'Pasuruan, Jawa Timur', lat: -7.6456, lng: 112.9056 },
    // Sumatera
    { location: 'Binjai, Sumatera Utara', lat: 3.6000, lng: 98.4833 },
    { location: 'Bukittinggi, Sumatera Barat', lat: -0.3063, lng: 100.3695 },
    { location: 'Lampung Tengah, Lampung', lat: -4.8000, lng: 105.3500 },
    // Sulawesi
    { location: 'Gowa, Sulawesi Selatan', lat: -5.2841, lng: 119.6744 },
    { location: 'Bone, Sulawesi Selatan', lat: -4.7372, lng: 120.3260 },
];

const DEMAND_LOCATIONS: { location: string; lat: number; lng: number }[] = [
    // Pasar-pasar besar
    { location: 'Pasar Induk Kramat Jati, Jakarta', lat: -6.2741, lng: 106.8686 },
    { location: 'Pasar Johar, Semarang', lat: -6.9832, lng: 110.4111 },
    { location: 'Pasar Pabean, Surabaya', lat: -7.2261, lng: 112.7376 },
    { location: 'Pasar Gede, Surakarta', lat: -7.5720, lng: 110.8290 },
    { location: 'Pasar Beringharjo, Yogyakarta', lat: -7.7952, lng: 110.3654 },
    { location: 'Pasar Baru, Bandung', lat: -6.9213, lng: 107.6075 },
    { location: 'Pasar Tanah Abang, Jakarta', lat: -6.1713, lng: 106.8170 },
    { location: 'Pasar Wage, Purwokerto', lat: -7.4288, lng: 109.2497 },
    { location: 'Pasar Legi, Surakarta', lat: -7.5556, lng: 110.8208 },
    { location: 'Pasar Besar, Malang', lat: -7.9797, lng: 112.6340 },
    { location: 'Pasar Pagi Samarinda, Kalimantan Timur', lat: -0.5022, lng: 117.1536 },
    { location: 'Pasar Tradisional Makassar, Sulawesi Selatan', lat: -5.1477, lng: 119.4327 },
];

const PETANI_NAMES = [
    'Pak Sugeng', 'Pak Slamet', 'Bu Yati',
    'Pak Bambang', 'Bu Sari', 'Pak Hendra',
    'Pak Eko', 'Bu Dewi', 'Pak Agus',
    'Bu Sumiati', 'Pak Hartono', 'Pak Widodo',
    'Bu Karsini', 'Pak Subagyo', 'Pak Jumari',
    'Bu Indriani', 'Pak Suharto', 'Pak Darmawan',
];

const PEDAGANG_NAMES = [
    'CV Berkah Tani', 'UD Sumber Makmur',
    'Pasar Rakyat Jaya', 'Koperasi Tani Maju',
    'PT Distribusi Nusantara', 'Toko Sembako Pak Amin',
    'UMKM Ibu Rukmi', 'Grosir Pangan Sejahtera',
    'Pasar Modern Bersama', 'UD Rejeki Lancar',
    'CV Mitra Tani Unggul', 'Kios Pak Rudi',
];

// ─── Utils ────────────────────────────────────────────────────────────────────

/** Gaussian-like random variation within ±range% */
function vary(base: number, rangePercent = 20): number {
    const factor = 1 + (Math.random() * 2 - 1) * (rangePercent / 100);
    return Math.round(base * factor);
}

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
    const prefix = ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'];
    const suffix = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
    return `${randomFrom(prefix)}${suffix}`;
}

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱  Tumbasna Seeder — mulai...\n');

    // ── 0. Wipe existing data ─────────────────────────────────────────────────
    console.log('🗑️   Membersihkan data lama...');
    await prisma.match.deleteMany();
    await prisma.productEntry.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅  Data lama dihapus.\n');

    // ── 1. Create Users ───────────────────────────────────────────────────────
    console.log('👤  Membuat user petani & pedagang...');

    const petaniUsers = [];
    for (let i = 0; i < PETANI_NAMES.length; i++) {
        const user = await prisma.user.create({
            data: {
                phoneNumber: `6281${String(i + 1).padStart(9, '0')}`,
                name: PETANI_NAMES[i],
                role: Role.PETANI,
            },
        });
        petaniUsers.push(user);
    }

    const pedagangUsers = [];
    for (let i = 0; i < PEDAGANG_NAMES.length; i++) {
        const user = await prisma.user.create({
            data: {
                phoneNumber: `6285${String(i + 1).padStart(9, '0')}`,
                name: PEDAGANG_NAMES[i],
                role: Role.PEDAGANG,
            },
        });
        pedagangUsers.push(user);
    }

    console.log(`✅  ${petaniUsers.length} petani, ${pedagangUsers.length} pedagang dibuat.\n`);

    // ── 2. Create SUPPLY entries (petani) ────────────────────────────────────
    console.log('📦  Membuat entri SUPPLY (stok petani)...');

    const supplyEntries = [];

    for (let i = 0; i < 60; i++) {
        const user = randomFrom(petaniUsers);
        const commodity = randomFrom(COMMODITIES);
        const loc = randomFrom(SUPPLY_LOCATIONS);

        const entry = await prisma.productEntry.create({
            data: {
                userId: user.id,
                type: EntryType.SUPPLY,
                commodity: commodity.name,
                qty: vary(500, 60),          // 200–800 kg
                price: vary(commodity.baseSupplyPrice, 20),
                location: loc.location,
                lat: loc.lat + (Math.random() - 0.5) * 0.01,
                lng: loc.lng + (Math.random() - 0.5) * 0.01,
                status: Status.ACTIVE,
                createdAt: daysAgo(Math.floor(Math.random() * 30)),
            },
        });
        supplyEntries.push(entry);
    }

    console.log(`✅  ${supplyEntries.length} entri SUPPLY dibuat.\n`);

    // ── 3. Create DEMAND entries (pedagang/pasar) ────────────────────────────
    console.log('🛒  Membuat entri DEMAND (kebutuhan pasar)...');

    const demandEntries = [];

    for (let i = 0; i < 50; i++) {
        const user = randomFrom(pedagangUsers);
        const commodity = randomFrom(COMMODITIES);
        const loc = randomFrom(DEMAND_LOCATIONS);

        const entry = await prisma.productEntry.create({
            data: {
                userId: user.id,
                type: EntryType.DEMAND,
                commodity: commodity.name,
                qty: vary(400, 50),
                price: vary(commodity.baseDemandPrice, 20),
                location: loc.location,
                lat: loc.lat + (Math.random() - 0.5) * 0.005,
                lng: loc.lng + (Math.random() - 0.5) * 0.005,
                status: Status.ACTIVE,
                createdAt: daysAgo(Math.floor(Math.random() * 30)),
            },
        });
        demandEntries.push(entry);
    }

    console.log(`✅  ${demandEntries.length} entri DEMAND dibuat.\n`);

    // ── 4. Create Matches (SME simulation) ──────────────────────────────────
    console.log('🔗  Membuat data pencocokan (Match)...');

    // Haversine helper
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let matchCount = 0;
    const matchedSupplyIds = new Set<string>();
    const matchedDemandIds = new Set<string>();

    // For each supply, find best compatible demand
    for (const supply of supplyEntries.sort(() => Math.random() - 0.5)) {
        if (!supply.lat || !supply.lng) continue;
        if (matchedSupplyIds.has(supply.id)) continue;

        const candidates = demandEntries.filter(d => {
            if (matchedDemandIds.has(d.id)) return false;
            if (d.commodity !== supply.commodity) return false;
            if (!d.lat || !d.lng) return false;
            const dist = haversine(Number(supply.lat), Number(supply.lng), Number(d.lat), Number(d.lng));
            if (dist > 200) return false; // relaxed to 200 km for seed diversity
            // Price: supply ≤ 115% of demand
            if (supply.price / d.price > 1.15) return false;
            return true;
        });

        if (candidates.length === 0) continue;

        // Pick random match status for variety
        const statusOptions: MatchStatus[] = [
            MatchStatus.PENDING, MatchStatus.PENDING,
            MatchStatus.MATCHED, MatchStatus.MATCHED, MatchStatus.MATCHED,
            MatchStatus.CANCELLED,
        ];
        const matchStatus = randomFrom(statusOptions);

        const demand = randomFrom(candidates);

        const match = await prisma.match.create({
            data: {
                supplyEntryId: supply.id,
                demandEntryId: demand.id,
                status: matchStatus,
                createdAt: new Date(
                    Math.max(supply.createdAt.getTime(), demand.createdAt.getTime()) +
                    Math.random() * 86_400_000 * 2 // 0–2 days after latest entry
                ),
            },
        });

        // Update entry statuses
        const entryStatus = matchStatus === MatchStatus.MATCHED ? Status.MATCHED : Status.ACTIVE;
        await prisma.productEntry.update({ where: { id: supply.id }, data: { status: entryStatus } });
        await prisma.productEntry.update({ where: { id: demand.id }, data: { status: entryStatus } });

        matchedSupplyIds.add(supply.id);
        matchedDemandIds.add(demand.id);
        matchCount++;
    }

    console.log(`✅  ${matchCount} pencocokan berhasil dibuat.\n`);

    // ── 5. Summary ────────────────────────────────────────────────────────────
    const totalUsers = petaniUsers.length + pedagangUsers.length;
    const totalSupply = supplyEntries.length;
    const totalDemand = demandEntries.length;
    const totalMatches = matchCount;

    console.log('─────────────────────────────────────────');
    console.log('🎉  SEEDER SELESAI!\n');
    console.log(`   👤  User       : ${totalUsers} (${petaniUsers.length} petani, ${pedagangUsers.length} pedagang)`);
    console.log(`   📦  Supply     : ${totalSupply} entri`);
    console.log(`   🛒  Demand     : ${totalDemand} entri`);
    console.log(`   🔗  Match      : ${totalMatches} pencocokan`);
    console.log('─────────────────────────────────────────');
    console.log('\n🌐  Buka http://localhost:3000/dashboard untuk melihat hasilnya.');
}

main()
    .catch(e => {
        console.error('❌  Seeder error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
