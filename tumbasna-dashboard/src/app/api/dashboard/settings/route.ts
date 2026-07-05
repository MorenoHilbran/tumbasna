import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        buyer: {
          midtransActive: true,
          codActive: true,
          bankTransferActive: true,
          maxCodRadius: 20,
          minOrderKg: 10,
          minOrderAmount: 50000,
          adminFee: 2500
        },
        supplier: {
          aiBotActive: true,
          aiModel: "llama-3.1-8b-instant",
          jamKerjaMulai: "08:00",
          jamKerjaSelesai: "17:00",
          whitelistCommodities: ["Beras", "Jagung", "Tomat", "Cabai Merah", "Cabai Rawit", "Bawang Merah", "Bawang Putih", "Kedelai", "Kentang"]
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return defaultConfig;
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading config.json:', err);
    return null;
  }
}

export async function GET() {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: config });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = readConfig();

    if (!config) {
      return NextResponse.json({ error: 'Failed to read configuration' }, { status: 500 });
    }

    // Merge new configs
    const updatedConfig = {
      buyer: { ...config.buyer, ...body.buyer },
      supplier: { ...config.supplier, ...body.supplier }
    };

    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (err: any) {
    console.error('Error updating config:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
