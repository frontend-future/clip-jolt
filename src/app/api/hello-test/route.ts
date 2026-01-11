import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Hello from test endpoint',
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Hello from test endpoint (GET)',
  });
}
