import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'procurement-secret-key-2024';

export interface AuthUser {
  userId: string;
  role: string;
}

export function getAuthUser(request: Request): AuthUser | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export function authResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
