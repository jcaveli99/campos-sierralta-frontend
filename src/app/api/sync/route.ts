import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db_sync.json');

const readDb = () => {
    try {
        if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
        console.error(e);
    }
    return {};
};

const writeDb = (data: any) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export async function GET() {
    return NextResponse.json(readDb());
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const db = readDb();
        const newDb = { ...db, ...body };
        writeDb(newDb);
        return NextResponse.json(newDb);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
