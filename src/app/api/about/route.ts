import { NextRequest, NextResponse } from 'next/server';
import { GET as getHandler, PUT as putHandler, POST as postHandler } from '@/app/api/profile/route';

export async function GET(request: NextRequest) {
  return getHandler();
}

export async function PUT(request: NextRequest) {
  return putHandler(request);
}

export async function POST(request: NextRequest) {
  return postHandler(request);
}
