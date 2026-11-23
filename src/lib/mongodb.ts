import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js DNS resolution to use reliable public DNS servers (Google & Cloudflare)
// This prevents local ISP / router DNS timeouts on SRV and TXT lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (e) {
  // setServers may fail in constrained environments or if already configured
  console.warn('[MongoDB DNS] Could not override default DNS servers:', e);
}

// Standard direct replicaSet connection string for cluster0 (bypasses SRV/TXT lookups entirely)
export const DIRECT_REPLICA_SET_URI =
  'mongodb://ahmedsalah567801_db_user:exAykKbHiBGVYtSX@ac-ke3hcdt-shard-00-00.hrersdl.mongodb.net:27017,ac-ke3hcdt-shard-00-01.hrersdl.mongodb.net:27017,ac-ke3hcdt-shard-00-02.hrersdl.mongodb.net:27017/a7med-arcade?ssl=true&replicaSet=atlas-wdfxbm-shard-0&authSource=admin&retryWrites=true&w=majority';

const RAW_URI = process.env.MONGODB_URI || DIRECT_REPLICA_SET_URI;

/**
 * Returns an effective connection string. If an SRV URI pointing to cluster0 is provided,
 * automatically convert it to the direct standard replicaSet URI to prevent queryTxt ETIMEOUT.
 */
export function getEffectiveUri(uri: string): string {
  if (uri.startsWith('mongodb+srv://') && uri.includes('cluster0.hrersdl.mongodb.net')) {
    return DIRECT_REPLICA_SET_URI;
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // If already connected, return cached connection
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.conn && cached.conn.connection.readyState === 2 && cached.promise) {
    return await cached.promise;
  }

  if (!cached.promise) {
    const effectiveUri = getEffectiveUri(RAW_URI);
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10s timeout
      family: 4,                      // Force IPv4 preference
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(effectiveUri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        // Clear cached promise on failure so subsequent attempts can retry
        cached.promise = null;
        cached.conn = null;

        // If custom URI failed and wasn't direct, try fallback to direct replicaSet URI
        if (effectiveUri !== DIRECT_REPLICA_SET_URI) {
          console.warn('[MongoDB] Falling back to direct replicaSet connection string...');
          return mongoose.connect(DIRECT_REPLICA_SET_URI, opts);
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
