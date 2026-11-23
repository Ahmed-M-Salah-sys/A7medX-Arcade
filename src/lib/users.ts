/**
 * users.ts — MongoDB-backed user operations (replaces JSON file operations)
 * All functions maintain the same signatures as the previous JSON-based version.
 * NOTE: sync-style functions are now async (callers already await them).
 */

import { StoredUser } from '@/types/user';
import connectToDatabase from '@/lib/mongodb';
import { UserModel } from '@/models/User';

// ─── Helper: convert Mongoose doc → StoredUser ───────────────────────────────

function docToStoredUser(doc: Record<string, unknown>): StoredUser {
  return {
    id: (doc.id ?? doc._id ?? '').toString(),
    name: (doc.name as string) ?? '',
    email: (doc.email as string) ?? '',
    password: (doc.password as string) ?? '',
    role: 'user' as const,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : typeof doc.createdAt === 'string'
        ? doc.createdAt
        : new Date().toISOString(),
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function getUsers(): Promise<StoredUser[]> {
  await connectToDatabase();
  const docs = await UserModel.find({}).lean();
  return (docs as unknown as Record<string, unknown>[]).map(docToStoredUser);
}

export async function getUserByEmail(email: string): Promise<StoredUser | undefined> {
  await connectToDatabase();
  const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (!doc) return undefined;
  return docToStoredUser(doc as unknown as Record<string, unknown>);
}

export async function createUser(
  data: Omit<StoredUser, 'id' | 'createdAt'>
): Promise<StoredUser> {
  await connectToDatabase();
  const doc = await UserModel.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: data.role ?? 'user',
  });
  return docToStoredUser(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateUser(updatedUser: StoredUser): Promise<boolean> {
  await connectToDatabase();
  const result = await UserModel.findOneAndUpdate(
    { $or: [{ _id: updatedUser.id }, { email: updatedUser.email.toLowerCase() }] },
    {
      $set: {
        name: updatedUser.name,
        email: updatedUser.email.toLowerCase(),
        password: updatedUser.password,
        role: updatedUser.role,
      },
    },
    { new: true }
  );
  return !!result;
}
