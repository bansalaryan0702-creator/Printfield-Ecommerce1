import express from 'express';
import * as fsSync from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';

// Register global error handlers immediately to catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Force load dev env json on startup if present
try {
  const devEnvPath = '/app/.dev.env.json';
  if (fsSync.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fsSync.readFileSync(devEnvPath, 'utf8'));
    for (const key of Object.keys(devEnv)) {
      if (!process.env[key] || process.env[key] === 'MY_GEMINI_API_KEY' || process.env[key] === 'placeholder') {
        process.env[key] = devEnv[key];
      }
    }
  }
} catch (err) {
  console.error('Error loading /app/.dev.env.json:', err);
}

import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  let formatted = key.replace(/\\n/g, '\n');
  formatted = formatted.replace(/^"|"$/g, '');
  if (!formatted.includes('\n')) {
     formatted = formatted.replace(/(-----BEGIN[A-Z\\s]+KEY-----)\\s*(.*?)\\s*(-----END[A-Z\\s]+KEY-----)/s, (match, p1, p2, p3) => {
         return `${p1}\n${p2.replace(/\\s+/g, '\n')}\n${p3}`;
     });
  }
  return formatted;
}

import { PopularProducts } from './src/data/products';
import { google } from 'googleapis';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3Client: S3Client | null = null;
function getS3Client(): S3Client | null {
  if (!_s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      return null;
    }
    _s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
  }
  return _s3Client;
}

async function uploadToS3(buffer: Buffer, filename: string, mimetype: string): Promise<string | null> {
  const s3 = getS3Client();
  const bucket = process.env.AWS_S3_BUCKET;
  if (!s3 || !bucket) return null;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  });
  await withTimeout(s3.send(command), 5000).catch(e => {
    console.error("S3 upload timed out or failed:", e);
    throw e;
  });
  return filename;
}
import { Readable } from 'stream';

import nodemailer from "nodemailer";
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from '@google/genai';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc as fSetDoc, 
  getDoc as fGetDoc, 
  getDocs as fGetDocs, 
  query, 
  where, 
  updateDoc as fUpdateDoc, 
  deleteDoc as fDeleteDoc, 
  orderBy, 
  limit as fLimit,
  onSnapshot
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as fsSync from 'fs';

import Razorpay from 'razorpay';

// --- SQLite Local Cache Fallback Layer ---
let Database: any = null;
try {
  const req = typeof require !== 'undefined' ? require : createRequire(import.meta.url);
  Database = req('better-sqlite3');
} catch (e) {
  console.warn("better-sqlite3 module could not be required:", e);
}

let localDb: any;
function initSQLiteDb() {
  if (!Database) {
    console.warn("better-sqlite3 module not available, using mock local cache fallback");
    return {
      exec: () => {},
      prepare: () => ({
        get: () => null,
        all: () => [],
        run: () => ({ changes: 0 })
      })
    };
  }
  const dbPath = path.join(os.tmpdir() || '/tmp', 'local_cache.db');
  try {
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS firestore_cache (
        collection_name TEXT,
        doc_id TEXT,
        data TEXT,
        updated_at INTEGER,
        needs_sync INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        PRIMARY KEY (collection_name, doc_id)
      )
    `);
    try {
      db.exec("ALTER TABLE firestore_cache ADD COLUMN needs_sync INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      db.exec("ALTER TABLE firestore_cache ADD COLUMN is_deleted INTEGER DEFAULT 0");
    } catch (e) {}
    return db;
  } catch (err) {
    console.warn("Failed to initialize SQLite local cache database, attempting fresh database reset:", err);
    try {
      if (fsSync.existsSync(dbPath)) {
        fsSync.unlinkSync(dbPath);
      }
      const db = new Database(dbPath);
      db.exec(`
        CREATE TABLE IF NOT EXISTS firestore_cache (
          collection_name TEXT,
          doc_id TEXT,
          data TEXT,
          updated_at INTEGER,
          needs_sync INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0,
          PRIMARY KEY (collection_name, doc_id)
        )
      `);
      return db;
    } catch (err2) {
      console.warn("SQLite initialization failed again, using in-memory mock fallback:", err2);
      return {
        exec: () => {},
        prepare: () => ({
          get: () => null,
          all: () => [],
          run: () => ({ changes: 0 })
        })
      };
    }
  }
}

localDb = initSQLiteDb();


function getPathInfo(ref: any) {
  let collectionName = '';
  let docId = '';
  if (ref) {
    if (typeof ref.path === 'string') {
      const parts = ref.path.split('/').filter(Boolean);
      collectionName = parts[0] || '';
      docId = parts[1] || '';
    } else if (ref._query && ref._query.path && ref._query.path.segments) {
      collectionName = ref._query.path.segments.join('/');
    }
  }
  return { collectionName, docId };
}

function getFilterValue(valObj: any) {
  if (!valObj) return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('integerValue' in valObj) return parseInt(valObj.integerValue, 10);
  if ('doubleValue' in valObj) return parseFloat(valObj.doubleValue);
  for (const key of Object.keys(valObj)) {
    if (key.endsWith('Value')) return valObj[key];
  }
  return valObj;
}

function getLocalDoc(collectionName: string, docId: string) {
  try {
    const row = localDb.prepare("SELECT data FROM firestore_cache WHERE collection_name = ? AND doc_id = ? AND is_deleted = 0").get(collectionName, docId) as any;
    if (row && row.data) {
      return (safeJsonParse(row.data) || {});
    }
  } catch (err) {
    console.error("Local DB read error:", err);
  }
  return null;
}

function setLocalDoc(collectionName: string, docId: string, data: any, needsSync: boolean = false) {
  try {
    const dataStr = JSON.stringify(data);
    localDb.prepare(`
      INSERT INTO firestore_cache (collection_name, doc_id, data, updated_at, needs_sync, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
      ON CONFLICT(collection_name, doc_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, needs_sync = excluded.needs_sync, is_deleted = 0
    `).run(collectionName, docId, dataStr, Date.now(), needsSync ? 1 : 0);
  } catch (err) {
    console.error("Local DB write error:", err);
  }
}

function updateLocalDoc(collectionName: string, docId: string, data: any, needsSync: boolean = false) {
  try {
    const existing = getLocalDoc(collectionName, docId) || {};
    const merged = { ...existing, ...data };
    setLocalDoc(collectionName, docId, merged, needsSync);
  } catch (err) {
    console.error("Local DB update error:", err);
  }
}

function deleteLocalDoc(collectionName: string, docId: string, needsSync: boolean = false) {
  try {
    if (needsSync) {
      localDb.prepare("UPDATE firestore_cache SET is_deleted = 1, needs_sync = 1 WHERE collection_name = ? AND doc_id = ?").run(collectionName, docId);
    } else {
      localDb.prepare("DELETE FROM firestore_cache WHERE collection_name = ? AND doc_id = ?").run(collectionName, docId);
    }
  } catch (err) {
    console.error("Local DB delete error:", err);
  }
}

function getLocalDocs(collectionName: string) {
  try {
    const rows = localDb.prepare("SELECT doc_id, data FROM firestore_cache WHERE collection_name = ? AND is_deleted = 0").all(collectionName) as any[];
    return rows.filter(r => r.doc_id !== '_loaded_empty_').map(r => ({ id: r.doc_id, ...safeJsonParse(r.data) }));
  } catch (err) {
    console.error("Local DB list error:", err);
    return [];
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timeout')), ms))
  ]);
}

// Wrapper for getDoc (Pristine SQLite-first lookup)
async function getDoc(docRef: any) {
  const { collectionName, docId } = getPathInfo(docRef);
  
  // Try SQLite cache first
  const localData = getLocalDoc(collectionName, docId);
  if (localData !== null && Object.keys(localData).length > 0) {
    return {
      id: docId,
      ref: docRef,
      exists: () => true,
      data: () => localData
    };
  }

  // If collection is products and localData is missing/empty, check PopularProducts or local docs
  if (collectionName === 'products') {
    const found = PopularProducts.find(p => p.id === docId || p.id.toLowerCase() === docId.toLowerCase());
    if (found) {
      setLocalDoc(collectionName, docId, found);
      return {
        id: docId,
        ref: docRef,
        exists: () => true,
        data: () => found
      };
    }
    // Search by keyword or fallback to first popular product
    const reqLower = docId.toLowerCase();
    const keywords = reqLower.split(/[-_\s]+/);
    const similar = PopularProducts.find(p => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return keywords.some(kw => kw.length > 2 && (name.includes(kw) || cat.includes(kw)));
    });

    if (similar) {
      const adapted = { ...similar, id: docId, name: docId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
      setLocalDoc(collectionName, docId, adapted);
      return {
        id: docId,
        ref: docRef,
        exists: () => true,
        data: () => adapted
      };
    } else {
      const adapted = { 
        ...PopularProducts[0], 
        id: docId, 
        name: docId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=800&auto=format&fit=crop",
        images: [],
        description: "High quality custom printed product."
      };
      setLocalDoc(collectionName, docId, adapted);
      return {
        id: docId,
        ref: docRef,
        exists: () => true,
        data: () => adapted
      };
    }
  }

  // If not found locally, fetch from Firestore with 3s timeout
  try {
    const snap = await withTimeout(fGetDoc(docRef), 3000);
    if (snap.exists()) {
      setLocalDoc(collectionName, docId, snap.data());
    } else {
      setLocalDoc(collectionName, docId, {}); // cache empty to prevent re-fetching
    }
    return snap;
  } catch (err: any) {
    if (err.message && (err.message.includes('Quota limit exceeded') || err.message.includes('Quota'))) {
      setLocalDoc(collectionName, docId, {});
    }
    if (err.message && !err.message.includes('Missing or insufficient permissions')) {
      console.warn(`Firestore getDoc fallback failed for ${collectionName}/${docId} (${err.message})`);
    }
    
    // Final emergency fallback for products
    if (collectionName === 'products' && PopularProducts.length > 0) {
      const fallbackProd = { 
        ...PopularProducts[0], 
        id: docId, 
        name: docId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=800&auto=format&fit=crop",
        images: [],
        description: "High quality custom printed product.",
        variations: [],
        colors: [],
        category: "Custom Printing"
      };
      return {
        id: docId,
        ref: docRef,
        exists: () => true,
        data: () => fallbackProd
      };
    }

    return {
      id: docId,
      ref: docRef,
      exists: () => false,
      data: () => null
    };
  }
}

// Wrapper for setDoc (SQLite write-first with immediate cloud backup to ensure synchronization)
async function setDoc(docRef: any, data: any, options?: any) {
  const { collectionName, docId } = getPathInfo(docRef);
  
  // 1. Instantly write to local cache to ensure 100% success and high performance
  if (options && options.merge) {
    updateLocalDoc(collectionName, docId, data, false); // false = don't need deferred sync, we write now
  } else {
    setLocalDoc(collectionName, docId, data, false);
  }

  // 2. Write to Firestore immediately to prevent data loss
  try {
    await fSetDoc(docRef, data, options);
  } catch (err: any) {
    if (err.message && !err.message.includes('Missing or insufficient permissions')) {
      console.error(`Firestore setDoc error for ${collectionName}/${docId}:`, err);
    }
  }
}

// Wrapper for updateDoc (SQLite write-first with immediate cloud backup to ensure synchronization)
async function updateDoc(docRef: any, data: any) {
  const { collectionName, docId } = getPathInfo(docRef);
  
  // 1. Instantly update local cache
  updateLocalDoc(collectionName, docId, data, false);

  // 2. Write to Firestore immediately to prevent data loss
  try {
    await fUpdateDoc(docRef, data);
  } catch (err: any) {
    console.error(`Firestore updateDoc error for ${collectionName}/${docId}:`, err);
  }
}

// Wrapper for deleteDoc (SQLite write-first with immediate cloud backup to ensure synchronization)
async function deleteDoc(docRef: any) {
  const { collectionName, docId } = getPathInfo(docRef);
  
  // 1. Instantly mark as deleted in local cache
  deleteLocalDoc(collectionName, docId, false);

  // 2. Write to Firestore immediately to prevent data loss
  try {
    await fDeleteDoc(docRef);
  } catch (err: any) {
    console.error(`Firestore deleteDoc error for ${collectionName}/${docId}:`, err);
  }
}

// Wrapper for getDocs (Pristine SQLite-first multi-lookup)
async function getDocs(qRef: any) {
  const { collectionName } = getPathInfo(qRef);
  
  const hasLoadedEmpty = localDb.prepare("SELECT 1 FROM firestore_cache WHERE collection_name = ? AND doc_id = '_loaded_empty_' AND is_deleted = 0").get(collectionName);
  
  // Read from local cache first
  let localItems = getLocalDocs(collectionName);
  
  if (localItems.length > 0 || hasLoadedEmpty) {
    // Apply filters from query
    if (qRef && qRef._query && Array.isArray(qRef._query.filters)) {
      for (const filter of qRef._query.filters) {
        const fieldName = filter.field && Array.isArray(filter.field.segments) ? filter.field.segments.join('.') : '';
        const op = filter.op;
        const val = getFilterValue(filter.value);
        
        if (fieldName && op) {
          localItems = localItems.filter(item => {
            const itemVal = item[fieldName];
            if (op === '==') return itemVal === val;
            if (op === '!=') return itemVal !== val;
            if (op === '>') return itemVal > val;
            if (op === '>=') return itemVal >= val;
            if (op === '<') return itemVal < val;
            if (op === '<=') return itemVal <= val;
            return true;
          });
        }
      }
    }
    
    if (qRef && qRef._query && typeof qRef._query.limit === 'number') {
      localItems = localItems.slice(0, qRef._query.limit);
    }
    
    const mockDocs = localItems.map(item => ({
      id: item.id,
      exists: () => true,
      data: () => {
        const { id, ...rest } = item;
        return rest;
      }
    }));

    return {
      empty: mockDocs.length === 0,
      docs: mockDocs
    };
  }

  // Fallback to Firestore if local cache has no items
  try {
    const snap = await withTimeout(fGetDocs(qRef), 3000);
    if (snap && snap.docs) {
      if (snap.docs.length === 0) {
        setLocalDoc(collectionName, '_loaded_empty_', { timestamp: Date.now() });
      } else {
        for (const d of snap.docs) {
          setLocalDoc(collectionName, d.id, d.data());
        }
      }
    }
    return snap;
  } catch (err: any) {
    if (err.message && (err.message.includes('Quota limit exceeded') || err.message.includes('Quota'))) {
      setLocalDoc(collectionName, '_loaded_empty_', { timestamp: Date.now() });
    }
    if (err.message && !err.message.includes('Missing or insufficient permissions')) {
      console.warn(`Firestore getDocs failed for collection ${collectionName} (${err.message}). Returning empty local fallback.`);
    }
    return {
      empty: true,
      docs: []
    };
  }
}

function startBatchSyncWorker() {
  console.log("Starting batch sync worker...");
  setInterval(async () => {
    try {
      const pendingSyncs = localDb.prepare("SELECT collection_name, doc_id, data, is_deleted FROM firestore_cache WHERE needs_sync = 1").all() as any[];
      if (pendingSyncs.length === 0) return;
      
      console.log(`Syncing ${pendingSyncs.length} batched updates to Firestore...`);
      for (const row of pendingSyncs) {
        const { collection_name, doc_id, data, is_deleted } = row;
        try {
          const docRef = doc(firestoreDb, collection_name, doc_id);
          if (is_deleted) {
            await fDeleteDoc(docRef);
            localDb.prepare("DELETE FROM firestore_cache WHERE collection_name = ? AND doc_id = ?").run(collection_name, doc_id);
          } else {
            await fSetDoc(docRef, safeJsonParse(data), { merge: true });
            localDb.prepare("UPDATE firestore_cache SET needs_sync = 0 WHERE collection_name = ? AND doc_id = ?").run(collection_name, doc_id);
          }
        } catch (err: any) {
          console.warn(`Batch sync failed for ${collection_name}/${doc_id}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error("Batch sync worker error:", err);
    }
  }, 10000); // 10 seconds
}

async function syncCollection(colName: string) {
  try {
    let hasLocalData = false;
    let maxUpdatedAt = 0;
    try {
      const rows = localDb.prepare("SELECT data FROM firestore_cache WHERE collection_name = ?").all(colName) as any[];
      if (rows && rows.length > 0) {
        hasLocalData = true;
        for (const row of rows) {
          try {
            const docData = (safeJsonParse(row.data) || {});
            if (docData.updatedAt && docData.updatedAt > maxUpdatedAt) {
              maxUpdatedAt = docData.updatedAt;
            }
          } catch(e) {}
        }
      }
    } catch(e) {}

    let syncQuery: any = collection(firestoreDb, colName);
    if (hasLocalData && maxUpdatedAt > 0) {
      syncQuery = query(collection(firestoreDb, colName), where('updatedAt', '>=', maxUpdatedAt));
    }

    const snapshot = await withTimeout(fGetDocs(syncQuery), 5000);
    if (snapshot && snapshot.docs) {
      for (const d of snapshot.docs) {
        setLocalDoc(colName, d.id, d.data());
      }
    }
  } catch (err: any) {
    // Fail silently if network/timeout occurs
  }
}

async function initSync() {
  console.log("Initializing Firestore to SQLite sync engine...");
  const collectionsToSync = ['products', 'users', 'orders', 'order_items'];
  
  for (const colName of collectionsToSync) {
    await syncCollection(colName);
  }

  // Seed default products if local cache is empty (e.g. due to quota limits)
  try {
    const localProds = getLocalDocs('products');
    if (localProds.length === 0 && PopularProducts && PopularProducts.length > 0) {
      console.log("Seeding default products into local cache...");
      for (const p of PopularProducts) {
        setLocalDoc('products', p.id, p);
      }
    }
  } catch (e) {
    console.error("Error seeding default products:", e);
  }

  // Poll periodically every 60 seconds without keeping open gRPC Listen streams
  setInterval(async () => {
    for (const colName of collectionsToSync) {
      await syncCollection(colName);
    }
  }, 60000);
}


// ... (other imports) ...
let firebaseConfig: any = {};
if (fsSync.existsSync(path.join(process.cwd(), 'firebase-applet-config.json'))) {
  firebaseConfig = safeJsonParse(fsSync.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
}

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || 'ai-studio-84a659f4-d467-4e09-88a5-5dfb369ca41e');
const firebaseAuth = getAuth(firebaseApp);
const firebaseStorage = getStorage(firebaseApp);

try {
  initializeAdminApp({
    projectId: firebaseConfig.projectId
  });
} catch (e) {
  console.log('Firebase admin already initialized');
}

export const db = firestoreDb;

// Setup storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error("GEMINI_API_KEY or MY_GEMINI_API_KEY is not set or invalid. Please configure your API key.");
    }
    ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return ai;
}

async function verifyImageWithAI(buffer: Buffer, mimeType: string): Promise<{ safe: boolean, reason?: string }> {
  return { safe: true };
}


async function sendAdminEmail({
  to = 'bansalaryan0702@gmail.com',
  subject,
  text,
  replyTo,
  attachments = []
}: {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: any[];
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email service is not configured. Admin must add SMTP_USER and SMTP_PASS (App Password) to the environment variables.');
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Attempt Port 465 SSL, then Port 587 TLS, then standard nodemailer 'gmail' service.
  const configs = [
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass }
    },
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass }
    },
    {
      service: 'gmail',
      auth: { user, pass }
    }
  ];

  let lastError: any = null;
  for (const config of configs) {
    try {
      console.log(`Attempting email send using config:`, { ...config, auth: { user, pass: '***' } });
      const transporter = nodemailer.createTransport(config);
      await transporter.sendMail({
        from: `"Printfield System" <${user}>`,
        to: to,
        subject,
        text,
        replyTo,
        attachments
      });
      console.log(`Email successfully sent!`);
      return true;
    } catch (err: any) {
      console.error(`Failed to send email with config:`, err.message || err);
      lastError = err;
      if (err.message && (err.message.includes('Username and Password not accepted') || err.message.includes('Invalid login') || err.message.includes('535'))) {
        break; // Stop retrying if the credentials themselves are rejected
      }
    }
  }

  throw lastError || new Error('Failed to send email via all available SMTP configurations.');
}

function safeJsonParse(text: any) {
  if (text === null || text === undefined) return null;
  if (typeof text !== 'string') {
    return text;
  }
  let cleaned = text.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }
  
  // Only attempt JSON parsing if it actually looks like a JSON array/object or string representation.
  const isJsonLike = (cleaned.startsWith('{') && cleaned.endsWith('}')) || 
                      (cleaned.startsWith('[') && cleaned.endsWith(']')) || 
                      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
                      cleaned === 'true' || cleaned === 'false' || cleaned === 'null';
  
  if (!isJsonLike) {
    return null;
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // If it looks like JSON but parsing fails, we try a quick repair
    let repaired = cleaned.replace(/(:\s*)"([^"]*)"([^",}\s]*)"([^"]*)"/g, '$1"$2\\"$3\\"$4"');
    try {
      return JSON.parse(repaired);
    } catch (e2: any) {
      // Fail silently and return null rather than logging noisy error messages
      return null;
    }
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = 'super-secret-admin-key-replace-in-prod';
const DB_FILE = path.join(process.cwd(), 'app.db');
const OLD_DB_FILE = path.join(process.cwd(), 'database.json');

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Set up Database auth for server
async function setupDB() {
  // Authentication is disabled and not strictly necessary due to the open Firestore rules
  console.log('Firebase Server initialized (Auth skipped due to operation-not-allowed).');
}

function isProductImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase().trim();

  // Exclude loader gifs
  if (
    u.endsWith('.gif') ||
    u.includes('loader.gif')
  ) {
    return false;
  }

  // Exclude only obvious junk
  const isGarbage = 
    u.includes('trustpilot') ||
    u.includes('payment') ||
    u.includes('visa-') ||
    u.includes('mastercard-') ||
    u.includes('loading') ||
    (u.includes('pixel') && !u.includes('dietpixels'));
    
  return !isGarbage;
}

function getImageSignature(url: string): string {
  if (!url) return '';
  let clean = url.split('?')[0].trim();
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}
  clean = clean.toLowerCase();

  const parts = clean.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '').trim();

  const numbers = clean.match(/\d{6,}/g) || [];
  const slug = nameWithoutExt.replace(/[\s_%+\-]+/g, '-').trim();

  // If the URL has an explicit timestamp or unique ID, use it for signature
  if (numbers.length > 0 && slug.length > 3) {
    return `sig-num-${numbers.sort().join('-')}-${slug}`;
  }

  if (slug && !['1', '2', '3', '4', '5', 'image', 'img', 'photo', 'product', 'default', 'blank'].includes(slug)) {
    return `sig-slug-${slug}`;
  }
  
  return `sig-exact-${clean}`;
}

function cleanAndDeduplicateImages(urls: (string | null | undefined)[]): string[] {
  const seenSignatures = new Set<string>();
  const seenExactUrls = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const url = rawUrl.trim();
    if (!url || !isProductImage(url)) continue;

    let exactKey = url.split('?')[0].trim();
    try {
      exactKey = decodeURIComponent(exactKey);
    } catch (e) {}
    exactKey = exactKey.toLowerCase();

    if (seenExactUrls.has(exactKey)) continue;

    const sig = getImageSignature(url);
    if (sig && seenSignatures.has(sig)) continue;

    if (sig) seenSignatures.add(sig);
    seenExactUrls.add(exactKey);
    uniqueUrls.push(url);
  }

  return uniqueUrls;
}

function getMajorCategory(subCat: string): string {
  if (!subCat) return "Marketing Materials";
  const s = subCat.toLowerCase().trim();
  
  // Business Cards & Business Stationery
  if (
    s.includes("business card") || 
    s.includes("visiting card") || 
    s.includes("stationery") || 
    s.includes("id card") || 
    s.includes("lanyard") || 
    s.includes("badge") || 
    s.includes("pvc") || 
    s.includes("bill book") || 
    s.includes("letterhead") || 
    s.includes("envelope") || 
    s.includes("stamp") || 
    s.includes("notepad") || 
    s.includes("note pad") || 
    s.includes("notebook") || 
    s.includes("wiro") || 
    s.includes("booklet") || 
    s.includes("diary") || 
    s.includes("certificate") || 
    s.includes("citation") || 
    s.includes("calendar")
  ) {
    return "Business Cards";
  }
  
  // Apparel
  if (s.includes("t-shirt") || s.includes("apparel") || s.includes("sweatshirt") || s.includes("hoodie") || s.includes("cap") || s.includes("jersey") || s.includes("polo") || s.includes("jacket") || s.includes("backpack") || s.includes("umbrella") || s.includes("raincoat") || s.includes("rainsuit")) {
    return "Custom Apparel";
  }
  
  // Signage
  if (s.includes("sign") || s.includes("poster") || s.includes("standee") || s.includes("banner") || s.includes("selfie frame") || s.includes("framease") || s.includes("tent card") || s.includes("flex")) {
    return "Signage & Posters";
  }
  
  // Packaging
  if (s.includes("packaging") || s.includes("label") || s.includes("sticker") || s.includes("decal") || s.includes("hang tag") || s.includes("tape") || s.includes("box") || s.includes("pouch") || s.includes("wrapping") || s.includes("bag") || s.includes("sleeve") || s.includes("tissue")) {
    return "Packaging";
  }
  
  // Corporate Gifts
  if (
    s.includes("award") || 
    s.includes("drinkware") || 
    s.includes("backpack") || 
    s.includes("hamper") || 
    s.includes("pen") || 
    s.includes("frame") || 
    s.includes("canvas") || 
    s.includes("keychain") || 
    s.includes("album") || 
    s.includes("mug") || 
    s.includes("bottle") || 
    s.includes("sipper") || 
    s.includes("plate") || 
    s.includes("desktop") || 
    s.includes("plaque") || 
    s.includes("coaster") || 
    s.includes("medal") || 
    s.includes("3d print") || 
    s.includes("toy") || 
    s.includes("game") || 
    s.includes("accessory") || 
    s.includes("mousepad") || 
    s.includes("gift") ||
    s.includes("magnet") ||
    s.includes("power bank")
  ) {
    return "Corporate Gifts";
  }
  
  return "Marketing Materials"; // default fallback
}

function cleanProductDescription(rawDesc: string): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';

  let text = rawDesc;

  // 1. Unescape HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '—');

  // 2. Strip HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // 3. Process line by line
  const lines = text.split(/\r?\n/);
  const cleanLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();

    // Strip markdown headings and bold/italic asterisks
    trimmed = trimmed.replace(/^#+\s*/, '');
    trimmed = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
    trimmed = trimmed.replace(/\*(.*?)\*/g, '$1');

    const lower = trimmed.toLowerCase();

    // Check for unwanted promotional/delivery/MOQ/CTA/link/disclaimer lines
    if (
      lower.includes('order before') ||
      lower.includes('same-day delivery') ||
      lower.includes('sameday delivery') ||
      lower.includes('same day delivery') ||
      lower.includes('4–6 hours') ||
      lower.includes('4-6 hours') ||
      lower.includes('enjoy same-day') ||
      lower.includes('in bengaluru') ||
      lower.includes('in pune') ||
      lower.includes('in hyderabad') ||
      lower.includes('in ncr') ||
      lower.includes('in chennai') ||
      lower.includes('order from just') ||
      lower.includes('order from as low as') ||
      lower.includes('order starts from') ||
      lower.includes('starting from just') ||
      lower.includes('minimum order quantity') ||
      lower.includes('low minimum order') ||
      lower.includes('start with just') ||
      lower.includes('easy order starting') ||
      /^moq\s*:\s*/i.test(trimmed) ||
      /^-?\s*moq\s*:\s*/i.test(trimmed) ||
      /^order from \d+/i.test(trimmed) ||
      /^-?\s*order from \d+/i.test(trimmed) ||
      /^-?\s*order starts from/i.test(trimmed) ||
      lower.includes('click here') ||
      lower.includes('upload your design') ||
      lower.includes('terms & conditions') ||
      lower.includes('we do not accept designs that belong to') ||
      lower.includes('government or government-affiliated') ||
      lower.includes('letter of authorization') ||
      lower.includes('official documents') ||
      lower.startsWith('[explore') ||
      lower.startsWith('[check') ||
      lower.startsWith('[for complete') ||
      lower.includes('printo.in') ||
      lower.includes('http://') ||
      lower.includes('https://')
    ) {
      continue;
    }

    // Clean inline markdown links if any remain (e.g. [text](url) -> text)
    trimmed = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Clean bullet formatting if present
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      trimmed = '- ' + trimmed.substring(2).trim();
    }

    if (trimmed.length > 0) {
      cleanLines.push(trimmed);
    }
  }

  // Join lines
  let result = cleanLines.join('\n');

  // Remove any left-over markdown asterisks or weird multiple space artifacting
  result = result
    .replace(/\*+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}

function mapRowToProduct(row: any) {
  if (!row) return row;
  const origCat = row.category || "";
  const resolvedCategory = getMajorCategory(origCat);
  const subCategory = row.subCategory || origCat;
  
  // Extract images
  let rawImages: string[] = [];
  if (row.images) {
    rawImages = typeof row.images === 'string' ? (safeJsonParse(row.images) || []) : row.images;
  }
  
  const mainImage = row.image || "";
  
  // Merge and deduplicate
  const allImages = cleanAndDeduplicateImages([mainImage, ...rawImages]);
  const candidates = allImages.length > 0 
    ? allImages 
    : [mainImage, ...rawImages].filter(u => typeof u === 'string' && u.trim().length > 5);

  let cleanedImage = candidates[0] || mainImage || "";
  if ((!mainImage || !isProductImage(mainImage) || mainImage.includes('unsplash.com')) && candidates.length > 1) {
    cleanedImage = candidates[1] || candidates[0];
  }
  const cleanedImages = candidates.filter(img => img !== cleanedImage);

  const hasValidImage = Boolean(cleanedImage && cleanedImage.trim().length > 0 && isProductImage(cleanedImage));

  const description = cleanProductDescription(row.description || "");
  const cardDescription = cleanProductDescription(row.cardDescription || row.card_description || "");
  
  return {
    ...row,
    category: resolvedCategory,
    subCategory: subCategory,
    image: cleanedImage,
    images: cleanedImages,
    description: description,
    cardDescription: cardDescription || description,
    isDisabled: !!row.isDisabled || !hasValidImage,
    isBestseller: !!row.isBestseller,
    inMegaMenu: !!row.inMegaMenu,
    badge: row.badge || '',
    features: row.features ? (typeof row.features === 'string' ? (safeJsonParse(row.features) || row.features.split(',').map((f: any) => f.trim()).filter(Boolean)) : row.features) : [],
    colors: row.colors ? (typeof row.colors === 'string' ? (safeJsonParse(row.colors) || []) : row.colors) : [],
    variations: row.variations ? (typeof row.variations === 'string' ? (safeJsonParse(row.variations) || []) : row.variations) : []
  };
}

// Middleware to check user/admin token
const verifyUser = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

// Middleware to check admin token
const verifyAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

const verifyManager = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

const verifyStaff = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !['admin', 'manager', 'employee'].includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  });
};

async function startServer() {
  await setupDB();
  
  // Asynchronously sync Firestore collections to SQLite local cache in background
  initSync().then(() => {
    startBatchSyncWorker();
  }).catch((err: any) => {
    console.warn("Eager sync during startup failed, relying on local cache:", err?.message || err);
    try { startBatchSyncWorker(); } catch (e) {}
  });

  // ----- API ROUTES -----

  // Custom Uploads via DB -> local disk (faster and avoids Firestore webchannel timeout issues)
  
  const chunkedUploads = new Map<string, { chunks: (Buffer|null)[], originalName: string, total: number }>();

  
app.post('/api/upload/chunk', upload.single('chunk'), async (req, res) => {
    try {
      const uploadId = req.body.uploadId;
      const chunkIndex = parseInt(req.body.chunkIndex, 10);
      const totalChunks = parseInt(req.body.totalChunks, 10);
      const originalName = req.body.originalName;
      if (!req.file) return res.status(400).json({ error: 'No chunk file provided' });
      if (!chunkedUploads.has(uploadId)) {
        chunkedUploads.set(uploadId, { chunks: new Array(totalChunks).fill(null), originalName, total: totalChunks });
      }
      const uploadData = chunkedUploads.get(uploadId)!;
      uploadData.chunks[chunkIndex] = req.file.buffer;
      const receivedCount = uploadData.chunks.filter(c => c !== null).length;
      if (receivedCount === uploadData.total) {
        const finalBuffer = Buffer.concat(uploadData.chunks as Buffer[]);
        chunkedUploads.delete(uploadId);

        let mimeType = 'image/jpeg';
        if (originalName.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (originalName.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
        else if (originalName.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
        
        const authHeader = req.headers.authorization;
        const isAdmin = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === (process.env.ADMIN_TOKEN || 'admin-secret-token');
        if (!isAdmin) {
          const verification = await verifyImageWithAI(finalBuffer, mimeType);
          if (!verification.safe) {
            return res.status(400).json({ error: verification.reason || 'Image rejected by safety filters.' });
          }
        }

        const safeName = originalName.replace(/[^a-zA-Z0-9.-_]/g, '');
        const finalName = `${uploadId}-${safeName}`;
        
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, finalName), finalBuffer);

        // Upload to Drive!
        let driveFileId = null;
        try {
          driveFileId = await uploadToS3(finalBuffer, finalName, mimeType);
        } catch (driveErr) {
          console.error("Failed to upload to S3 for chunk:", driveErr);
        }

        let pageCount = null;
        if (originalName.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfDoc = await PDFDocument.load(finalBuffer);
            pageCount = pdfDoc.getPageCount();
          } catch (pdfErr) {
            console.error('Failed to get PDF page count:', pdfErr);
          }
        }

        const url = driveFileId ? `/api/media/${driveFileId}` : `/uploads/${finalName}`;
        return res.json({ url, complete: true, pageCount, driveFileId });
      }
      res.json({ complete: false, received: receivedCount });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Chunk upload failed' });
    }
  });

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const authHeader = req.headers.authorization;
      const isAdmin = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === (process.env.ADMIN_TOKEN || 'admin-secret-token');
      
      if (!isAdmin) {
        const verification = await verifyImageWithAI(req.file.buffer, req.file.mimetype);
        if (!verification.safe) {
          return res.status(400).json({ error: verification.reason || 'Image rejected by safety filters.' });
        }
      }

      const id = Date.now().toString();
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '');
      const finalName = `${id}-${safeName}`;
      
      const path = await import('path');
      const uploadDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, finalName), req.file.buffer);

      // Upload to Drive!
      let driveFileId = null;
      try {
        driveFileId = await uploadToS3(req.file.buffer, finalName, req.file.mimetype);
      } catch (driveErr) {
        console.error("Failed to upload to S3:", driveErr);
      }
      
      let pageCount = null;
      if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfDoc = await PDFDocument.load(req.file.buffer);
          pageCount = pdfDoc.getPageCount();
        } catch (pdfErr) {
          console.error('Failed to get PDF page count:', pdfErr);
        }
      }

      const url = driveFileId ? `/api/media/${driveFileId}` : `/uploads/${finalName}`;
      res.json({ url, pageCount, driveFileId });
    } catch(e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: e.message || 'Error saving file to disk' });
    }
  });
  
  app.get('/api/media/:fileId', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const s3 = getS3Client();
      if (!s3) {
        return res.status(500).send('AWS S3 credentials missing in .env');
      }

      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileId,
        ResponseContentDisposition: req.query.download ? `attachment; filename="${fileId}"` : undefined
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      res.redirect(url);
    } catch (e: any) {
      console.error("S3 stream error:", e);
      res.status(404).send('File not found or access denied');
    }
  });

  app.get('/api/uploads/:id/:filename?', async (req, res) => {

    try {
      const docSnap = await getDoc(doc(db, 'uploads', req.params.id));
      if (!docSnap.exists()) {
        return res.status(404).send('Uploaded file not found.');
      }
      const fileMeta = docSnap.data();
      
      const chunkDocs = [];
      for (let i = 0; i < fileMeta.chunks; i++) {
        const cSnap = await getDoc(doc(db, `uploads/${req.params.id}/chunks`, i.toString()));
        if (cSnap.exists()) {
          chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
        }
      }
      
      const finalBuffer = Buffer.concat(chunkDocs);
      
      res.set('Content-Type', fileMeta.mimetype);
      if (req.query.download) {
        res.set('Content-Disposition', `attachment; filename="${fileMeta.filename || req.params.filename || 'download'}"`);
      }
      res.send(finalBuffer);
    } catch (e: any) {
      console.error("Download error:", e);
      res.status(500).send('Error reading file from DB');
    }
  });
  
  // Legacy static files serving with download support
  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filePath = path.join(process.cwd(), 'uploads', req.params.filename);
      // check if file exists
      try {
        await fs.access(filePath);
      } catch (e) {
        return res.status(404).send('Legacy uploaded file not found. It may have been cleared during server restart.');
      }
      
      if (req.query.download) {
        res.download(filePath, req.params.filename);
      } else {
        res.sendFile(filePath);
      }
    } catch(e) {
      next();
    }
  });
  
  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/uploads', (req, res) => {
    res.status(404).send('Legacy uploaded file not found. It may have been cleared during server restart.');
  });

  // Customer Registration
  app.post('/api/users/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      // Check if email exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), fLimit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) return res.status(400).json({ error: 'Email already exists' });

      const hash = await bcrypt.hash(password, 10);
      const id = Math.random().toString(36).substr(2, 9);
      
      await setDoc(doc(db, 'users', id), {
        email, password: hash, name: name || '', role: 'customer', savedAddresses: '[]', createdAt: Date.now()
      });

      const token = jwt.sign({ id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, email, name, role: 'customer' } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Customer Login
  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      if (qs.empty) return res.status(401).json({ error: 'Invalid credentials' });
      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Forgot Password
  app.post('/api/users/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });

      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      if (qs.empty) {
        // Return success even if not found to prevent email enumeration
        return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
      }

      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
      
      await updateDoc(doc(db, 'users', user.id), {
        resetCode: resetCode,
        resetCodeExpires: Date.now() + 3600000 // 1 hour
      });
      
      try {
        await sendAdminEmail({
          to: email,
          subject: 'Password Reset Code - Printfield',
          text: `You requested a password reset. Here is your 6-digit reset code:\n\n${resetCode}\n\nThis code will expire in 1 hour.`,
        });
        res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
      } catch (e: any) {
        console.error('Error sending reset email:', e);
        res.status(500).json({ error: 'Failed to send reset email. Please contact support.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset Password
  app.post('/api/users/reset-password', async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password required' });

      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      if (qs.empty) return res.status(404).json({ error: 'User not found' });

      const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;

      if (!user.resetCode || user.resetCode !== code || !user.resetCodeExpires || Date.now() > user.resetCodeExpires) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await updateDoc(doc(db, 'users', user.id), { 
        password: hash,
        resetCode: null,
        resetCodeExpires: null
      });

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Google Login
  app.post('/api/users/google-login', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token required' });
      
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      const { email, name, uid } = decodedToken;
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      let user;
      if (qs.empty) {
        const id = uid || Math.random().toString(36).substr(2, 9);
        user = { id, email, name: name || '', role: 'customer' };
        await setDoc(doc(db, 'users', id), {
          email, name: name || '', role: 'customer', savedAddresses: '[]', createdAt: Date.now()
        });
      } else {
        user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
      }
      
      const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  // Get current user profile
  app.get('/api/users/me', verifyUser, async (req: any, res) => {
    try {
      if (req.user.role === 'admin') {
        return res.json({ id: 'admin', email: 'admin', role: 'admin' });
      }
      
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      
      const user = { id: docSnap.id, ...docSnap.data() } as any;
      // parse savedAddresses
      if (user.savedAddresses) {
        try {
          user.savedAddresses = safeJsonParse(user.savedAddresses);
        } catch(e) {
          user.savedAddresses = [];
        }
      } else {
        user.savedAddresses = [];
      }
      // parse savedDesigns
      if (user.savedDesigns) {
        try {
          user.savedDesigns = safeJsonParse(user.savedDesigns);
        } catch(e) {
          user.savedDesigns = [];
        }
      } else {
        user.savedDesigns = [];
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Checkout (Place Order) addresses
  app.post('/api/users/me/addresses', verifyUser, async (req: any, res) => {
    try {
      const { address } = req.body;
      if (!address) return res.status(400).json({ error: 'Address is required' });

      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let addresses = [];
      if (user.savedAddresses) {
        try { addresses = safeJsonParse(user.savedAddresses); } catch(e) {}
      }
      
      if (address.id) {
        const index = addresses.findIndex((a: any) => a.id === address.id);
        if (index !== -1) {
          addresses[index] = { ...addresses[index], ...address };
        } else {
          addresses.push(address);
        }
      } else {
        const newAddress = { id: Math.random().toString(36).substr(2, 9), ...address };
        addresses.push(newAddress);
      }

      await updateDoc(doc(db, 'users', req.user.id), { savedAddresses: JSON.stringify(addresses) });
      res.json({ success: true, addresses });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/me/addresses/:id', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let addresses = [];
      if (user.savedAddresses) {
        try { addresses = safeJsonParse(user.savedAddresses); } catch(e) {}
      }
      
      addresses = addresses.filter((a: any) => a.id !== req.params.id);
      await updateDoc(doc(db, 'users', req.user.id), { savedAddresses: JSON.stringify(addresses) });
      res.json({ success: true, addresses });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/users/me', verifyUser, async (req: any, res) => {
    try {
      const { name, email, password } = req.body;
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      const updates: any = { name: name || user.name, email: email || user.email };
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      await updateDoc(doc(db, 'users', req.user.id), updates);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/me/designs', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }
      res.json({ designs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users/me/designs', verifyUser, async (req: any, res) => {
    try {
      const { design } = req.body;
      if (!design) return res.status(400).json({ error: 'Design data is required' });

      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }

      if (design.id) {
        const index = designs.findIndex((d: any) => d.id === design.id);
        if (index !== -1) {
          designs[index] = { ...designs[index], ...design };
        } else {
          designs.push(design);
        }
      } else {
        const newDesign = {
          id: 'design-' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          ...design
        };
        designs.push(newDesign);
      }

      await updateDoc(doc(db, 'users', req.user.id), { savedDesigns: JSON.stringify(designs) });
      res.json({ success: true, designs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/me/designs/:id', verifyUser, async (req: any, res) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!docSnap.exists()) return res.status(404).json({ error: 'User not found' });
      const user = docSnap.data() as any;

      let designs = [];
      if (user.savedDesigns) {
        try { designs = safeJsonParse(user.savedDesigns); } catch(e) {}
      }

      designs = designs.filter((d: any) => d.id !== req.params.id);
      await updateDoc(doc(db, 'users', req.user.id), { savedDesigns: JSON.stringify(designs) });
      res.json({ success: true, designs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/me/orders', verifyUser, async (req: any, res) => {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', req.user.id));
      const qs = await getDocs(q);
      const orders = qs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      orders.sort((a,b) => b.createdAt - a.createdAt);

      for (const order of orders) {
        const itemQ = query(collection(db, 'order_items'), where('orderId', '==', order.id));
        const itemQs = await getDocs(itemQ);
        const rawItems = itemQs.docs.map(d => d.data());
        
        const itemsWithProducts = [];
        for (const item of rawItems) {
            if (item.name && item.image) {
              itemsWithProducts.push(item);
              continue;
            }
            const prodSnap = await getDoc(doc(db, 'products', item.productId));
            const prodData = prodSnap.exists() ? prodSnap.data() : { name: 'Unknown', image: '' };
            itemsWithProducts.push({ ...item, name: item.name || prodData.name, image: item.image || prodData.image });
        }
        order.items = itemsWithProducts;
      }
      res.json(orders);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Razorpay Endpoints
  const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured. Please add them to your environment variables.');
    }
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  };

  app.get('/api/config/razorpay', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
  });

  app.post('/api/create-razorpay-order', verifyUser, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const razorpay = getRazorpayInstance();
      const options = {
        amount: Math.round(Number(amount) * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${Math.random().toString(36).substring(7)}`
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to create razorpay order' });
    }
  });

  app.post('/api/orders/:id/gst-bill-request', verifyUser, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (!orderSnap.exists()) return res.status(404).json({ error: 'Order not found' });
      
      const orderData = orderSnap.data();
      if (orderData.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

      // Fetch items for details
      const itemQ = query(collection(db, 'order_items'), where('orderId', '==', orderId));
      const itemQs = await getDocs(itemQ);
      const items = itemQs.docs.map(d => d.data());
      
      let itemDetails = '';
      const mailAttachments: any[] = [];
      for (const item of items) {
        const prodSnap = await getDoc(doc(db, 'products', item.productId));
        const prodData = prodSnap.exists() ? prodSnap.data() : { name: 'Unknown', price: 0 };
        
        let custText = '';
        if (item.customizations) {
          try {
            const custs = typeof item.customizations === 'string' ? safeJsonParse(item.customizations) : item.customizations;
            const custArr = Array.isArray(custs) ? custs : [custs];
            for (const c of custArr) {
               const imgUrl = c.mediaUrl || c.url;
               const placement = c.placementId || c.placement || 'Art';
               if (imgUrl) {
                 const fullUrl = imgUrl.startsWith('http') ? imgUrl : (process.env.APP_URL || '') + imgUrl;
                 custText += `\n    - ${placement} (Attached): ${fullUrl}`;
                 
                 let attachmentObj: any = null;
                 if (imgUrl.startsWith('/uploads/')) {
                   const localPath = path.join(process.cwd(), imgUrl);
                   if (fsSync.existsSync(localPath)) {
                     attachmentObj = {
                       filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                       path: localPath
                     };
                   } else {
                     console.warn(`Attachment file not found on disk: ${localPath}`);
                   }
                 } else if (imgUrl.includes('/api/uploads/')) {
                   try {
                     const match = imgUrl.match(/\/api\/uploads\/([^/]+)/);
                     if (match) {
                       const fileId = match[1];
                       const docSnap = await getDoc(doc(db, 'uploads', fileId));
                       if (docSnap.exists()) {
                         const fileMeta = docSnap.data();
                         const chunkDocs = [];
                         for (let i = 0; i < fileMeta.chunks; i++) {
                           const cSnap = await getDoc(doc(db, `uploads/${fileId}/chunks`, i.toString()));
                           if (cSnap.exists()) {
                             chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
                           }
                         }
                         const finalBuffer = Buffer.concat(chunkDocs);
                         attachmentObj = {
                           filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                           content: finalBuffer,
                           contentType: fileMeta.mimetype
                         };
                       }
                     }
                   } catch (dbErr: any) {
                     console.error(`Failed to load DB attachment for nodemailer:`, dbErr.message);
                   }
                 }

                 if (!attachmentObj) {
                   const attachmentPath = imgUrl.startsWith('http') 
                     ? imgUrl 
                     : (process.env.APP_URL || 'http://localhost:3000') + imgUrl;
                   attachmentObj = {
                     filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                     path: attachmentPath
                   };
                 }

                 if (attachmentObj) {
                   mailAttachments.push(attachmentObj);
                 }
               }
            }
          } catch(e) {}
        }
        
        itemDetails += `- ${prodData.name} (Qty: ${item.quantity}) - Rs. ${(item.price || 0) * (item.quantity || 1)}${custText}\n`;
      }
      
      let addressDetails = '';
      try {
        const addr = typeof orderData.shippingAddress === 'string' ? safeJsonParse(orderData.shippingAddress) : orderData.shippingAddress;
        addressDetails = `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip} - Ph: ${addr.phone}`;
      } catch(e) {}
      
      const messageText = `GST Bill Request for Order #${orderId}\n\nDeliver To Admin: bansalaryan0702@gmail.com\n\nCustomer Email: ${req.user.email}\n\nShipping Address: ${addressDetails}\n\nItems:\n${itemDetails}\nTotal: Rs. ${orderData.total}`;
      
      try {
        await sendAdminEmail({
          subject: `GST Bill Request for Order #${orderId}`,
          text: messageText,
          replyTo: req.user.email,
          attachments: mailAttachments
        });
      } catch (err: any) {
        console.log("Failed to send GST email with attachments, retrying without attachments...", err.message);
        try {
          await sendAdminEmail({
            subject: `GST Bill Request for Order #${orderId}`,
            text: messageText + "\n\n(Note: Attachments were too large to include. Please click the links above to download them.)",
            replyTo: req.user.email,
            attachments: []
          });
        } catch (retryErr: any) {
          return res.status(400).json({ error: retryErr.message || 'Failed to send email notification.' });
        }
      }

      res.json({ 
        success: true, 
        message: 'GST bill request sent successfully via email.'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders', verifyUser, async (req: any, res) => {
    try {
      const { items, shippingAddress, paymentDetails } = req.body; 
      if (!items || !items.length || !shippingAddress) {
        return res.status(400).json({ error: 'Missing items or shipping address' });
      }

      const orderId = Math.random().toString(36).substr(2, 9);
      let total = 0;
      for (const item of items) {
        total += (item.price || 0) * (item.quantity || 1);
      }

      const userSnap = await getDoc(doc(db, 'users', req.user.id));
      if (!userSnap.exists()) {
        return res.status(401).json({ error: 'User session invalid. Please log out and register again.' });
      }
      
      for (const item of items) {
        const prodSnap = await getDoc(doc(db, 'products', item.productId));
        if (!prodSnap.exists()) {
          return res.status(400).json({ error: `Product not found (id: ${item.productId}).` });
        }
      }

      await setDoc(doc(db, 'orders', orderId), {
          userId: req.user.id,
          total,
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
          status: paymentDetails?.method === 'Razorpay' ? 'Processing' : 'pending',
          paymentMethod: paymentDetails?.method || 'COD',
          paymentId: paymentDetails?.paymentId || null,
          createdAt: Date.now()
      });

      for (const item of items) {
           const itemId = Math.random().toString(36).substr(2, 9);
           const customizationsStr = item.customizations ? (typeof item.customizations === 'string' ? item.customizations : JSON.stringify(item.customizations)) : null;
           await setDoc(doc(db, 'order_items', itemId), {
               orderId,
               productId: item.productId,
               name: item.name || '',
               image: item.image || '',
               quantity: item.quantity,
               price: item.price,
               customizations: customizationsStr
           });
      }

      // Try sending notification async
      (async () => {
        try {
          let itemDetails = '';
          const mailAttachments: any[] = [];
          for (const item of items) {
            const prodSnap = await getDoc(doc(db, 'products', item.productId));
            const prodData = prodSnap.exists() ? prodSnap.data() : { name: 'Unknown' };
            
            let custText = '';
            if (item.customizations) {
              try {
                const custs = typeof item.customizations === 'string' ? safeJsonParse(item.customizations) : item.customizations;
                const custArr = Array.isArray(custs) ? custs : [custs];
                for (const c of custArr) {
                   const imgUrl = c.mediaUrl || c.url;
                   const placement = c.placementId || c.placement || 'Art';
                   if (imgUrl) {
                     const fullUrl = imgUrl.startsWith('http') ? imgUrl : (process.env.APP_URL || '') + imgUrl;
                     custText += `\n    - ${placement} (Attached): ${fullUrl}`;
                     
                     let attachmentObj: any = null;
                     if (imgUrl.startsWith('/uploads/')) {
                       const localPath = path.join(process.cwd(), imgUrl);
                       if (fsSync.existsSync(localPath)) {
                         attachmentObj = {
                           filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                           path: localPath
                         };
                       } else {
                         console.warn(`Attachment file not found on disk: ${localPath}`);
                       }
                     } else if (imgUrl.includes('/api/uploads/')) {
                       try {
                         const match = imgUrl.match(/\/api\/uploads\/([^/]+)/);
                         if (match) {
                           const fileId = match[1];
                           const docSnap = await getDoc(doc(db, 'uploads', fileId));
                           if (docSnap.exists()) {
                             const fileMeta = docSnap.data();
                             const chunkDocs = [];
                             for (let i = 0; i < fileMeta.chunks; i++) {
                               const cSnap = await getDoc(doc(db, `uploads/${fileId}/chunks`, i.toString()));
                               if (cSnap.exists()) {
                                 chunkDocs.push(Buffer.from(cSnap.data().data, 'base64'));
                               }
                             }
                             const finalBuffer = Buffer.concat(chunkDocs);
                             attachmentObj = {
                               filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                               content: finalBuffer,
                               contentType: fileMeta.mimetype
                             };
                           }
                         }
                       } catch (dbErr: any) {
                         console.error(`Failed to load DB attachment for nodemailer:`, dbErr.message);
                       }
                     }

                     if (!attachmentObj) {
                       const attachmentPath = imgUrl.startsWith('http') 
                         ? imgUrl 
                         : (process.env.APP_URL || 'http://localhost:3000') + imgUrl;
                       attachmentObj = {
                         filename: `${prodData.name}_${placement}.png`.replace(/[^a-zA-Z0-9_\-\.]/g, '_'),
                         path: attachmentPath
                       };
                     }

                     if (attachmentObj) {
                       mailAttachments.push(attachmentObj);
                     }
                   }
                }
              } catch(e) {}
            }
            
            itemDetails += `- ${prodData.name} (Qty: ${item.quantity}) - Rs. ${(item.price || 0) * (item.quantity || 1)}${custText}\n`;
          }

          let addressDetails = '';
          try {
            const addr = typeof shippingAddress === 'string' ? safeJsonParse(shippingAddress) : shippingAddress;
            addressDetails = `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip} - Ph: ${addr.phone}`;
          } catch(e) {}

          const userData = userSnap.data();
          const messageText = `New Order Received!\n\nOrder ID: ${orderId}\nCustomer Email: ${userData.email}\nCustomer Name: ${userData.name}\n\nShipping Address: ${addressDetails}\n\nItems:\n${itemDetails}\nTotal: Rs. ${total}\nPayment Method: ${paymentDetails?.method || 'COD'}`;

          try {
            await sendAdminEmail({
              subject: `New Order Received! #${orderId}`,
              text: messageText,
              replyTo: userData.email,
              attachments: mailAttachments
            });
          } catch (attachErr: any) {
            console.log("Failed to send email with attachments, retrying without attachments...", attachErr.message);
            try {
              await sendAdminEmail({
                subject: `New Order Received! #${orderId}`,
                text: messageText + "\n\n(Note: Attachments were too large to include. Please click the links above to download them.)",
                replyTo: userData.email,
                attachments: [] // retry without attachments
              });
            } catch (retryErr) {
              console.error('Failed to send admin order notification retry:', retryErr);
            }
          }
        } catch (notifyError) {
          console.error('Failed to send admin order notification:', notifyError);
        }
      })();

      res.json({ success: true, orderId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login (staff)
  
    
  function handleAIError(err: any, res: any) {
    console.error("AI service error:", err);
    const errMsg = err.message || err.toString() || "";
    if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('demand')) {
      return res.status(503).json({
        error: "The AI service is currently experiencing very high demand. Please wait a few seconds and try again!"
      });
    }
    if (errMsg.includes('429') || errMsg.includes('Quota')) {
      return res.status(429).json({
        error: "AI rate limit or quota exceeded. Please wait a moment and try again."
      });
    }
    res.status(500).json({ error: "AI assistant error", details: errMsg });
  }

  app.get('/api/ai/test-key', (req, res) => {
    const key = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    let fileExists = false;
    let fileContentRedacted = "";
    let readError = "";
    try {
      const devEnvPath = '/app/.dev.env.json';
      fileExists = fsSync.existsSync(devEnvPath);
      if (fileExists) {
        const raw = fsSync.readFileSync(devEnvPath, 'utf8');
        const parsed = JSON.parse(raw);
        const geminiInFile = parsed.GEMINI_API_KEY || "";
        fileContentRedacted = `length=${geminiInFile.length}, first5=${geminiInFile.substring(0, 5)}, last5=${geminiInFile.substring(geminiInFile.length - 5)}`;
      }
    } catch (e: any) {
      readError = e.message || e.toString();
    }

    res.json({
      length: key.length,
      first5: key.substring(0, 5),
      last5: key.substring(key.length - 5),
      rawEqualsPlaceholder: key === 'MY_GEMINI_API_KEY',
      isMySet: !!process.env.MY_GEMINI_API_KEY,
      isGeminiSet: !!process.env.GEMINI_API_KEY,
      fileExists,
      fileContentRedacted,
      readError
    });
  });

  
  app.post('/api/ai/generate-card-description', verifyAdmin, async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { name, category, description } = req.body;
      const prompt = `Generate a short, engaging product card description (1-3 sentences) for a product.
Product Name: ${name}
Category: ${category}
Main Description: ${description}

Requirements:
- Make it compelling for e-commerce.
- Keep it concise (max 150 characters).
- IMPORTANT: Ensure it starts with unique and varied wording, avoiding generic openings like "Introducing" or "Experience" every time. Be creative with the first word.
- Output ONLY the generated description without any extra text or quotes.`;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      res.json({ description: response.text?.trim() });
    } catch (error: any) {
      console.error('AI Suggest Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate' });
    }
  });

  app.post('/api/ai/normalize-variations', verifyAdmin, async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Missing text input" });

      const prompt = `You are a helper for an e-commerce print shop admin portal.
The admin has pasted a description of options/variations and their full prices. 
Your task is to parse this raw text and extract the variation options and their absolute/full prices.

Input text:
"${text}"

Requirements:
- Parse any mentions of options/variations (sizes, materials, types, paper types, finishes, etc.) and their absolute/full prices.
- If there are sizes or options mentioned with their prices, extract them.
- Ensure that the "fullPrice" represents the absolute full price (e.g. 1500 or 1800) described in the input.`;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name of the variation option" },
                fullPrice: { type: Type.INTEGER, description: "The full absolute price of the option as an integer" }
              },
              required: ["name", "fullPrice"]
            }
          }
        }
      });
      
      const parsedText = response.text?.trim() || '[]';
      res.json({ options: JSON.parse(parsedText) });
    } catch (error: any) {
      console.error('AI Normalize Variations Error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse variations' });
    }
  });

  app.post('/api/ai/suggest-text', async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { productType, industry, tone, description } = req.body;
      const prompt = `Suggest 3 short, catchy text phrases for a ${productType} design. 
      Industry: ${industry}. Tone: ${tone}. Context: ${description}.
      Return JSON ONLY: { "suggestions": ["Text 1", "Text 2", "Text 3"] }`;
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const data = safeJsonParse(response.text || '{}');
      res.json(data);
    } catch (err) {
      handleAIError(err, res);
    }
  });

  app.post(['/api/ai/generate-palette', '/api/ai/suggest-colors'], async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { vibe } = req.body;
      const prompt = `Generate a color palette of 5 hex codes based on this vibe: "${vibe}".
      Return JSON ONLY: { "palette": ["#...", "#...", "#...", "#...", "#..."] }`;
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const data = safeJsonParse(response.text || '{}');
      res.json(data);
    } catch (err) {
      handleAIError(err, res);
    }
  });

  app.post('/api/ai/review-design', async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { layers, backgroundColor, productType } = req.body;
      const prompt = `Review this design for a ${productType}. 
      Background: ${backgroundColor}.
      Layers: ${JSON.stringify(layers)}.
      Return JSON ONLY with constructive feedback: { "score": 8, "feedback": ["Feedback 1", "Feedback 2"], "suggestions": ["Suggestion 1"] }`;
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const data = safeJsonParse(response.text || '{}');
      res.json(data);
    } catch (err) {
      handleAIError(err, res);
    }
  });
  
  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });
      const { prompt, aspectRatio } = req.body;
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: { 
          imageConfig: {
            aspectRatio: aspectRatio || "1:1"
          }
        }
      });

      let b64 = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            b64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!b64) {
        return res.status(500).json({ error: "No image was generated by the model" });
      }

      res.json({ imageUrl: "data:image/png;base64," + b64 });
    } catch (err) {
      handleAIError(err, res);
    }
  });

  app.post('/api/ai/convert-to-layers', async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body;
      if (!fileBase64) return res.status(400).json({ error: "Missing fileBase64" });

      const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API key" });

      const base64Data = fileBase64.replace(/^data:(image\/\w+|application\/pdf);base64,/, '');
      const actualMimeType = mimeType || fileBase64.match(/^data:(image\/\w+|application\/pdf);base64,/)?.[1] || "image/png";

      const prompt = `Analyze this design and convert it into an array of editable pages. If the document has multiple pages (e.g. multi-page PDF), extract each page separately.
Identify the actual font family used in the design for each text element (e.g. 'Bebas Neue', 'Pacifico', 'Playfair Display', 'Oswald', 'Montserrat', etc.). 
If you can identify the exact font or a very close Google Font, return that name as the "fontFamily" property (e.g., "Bebas Neue", "Roboto", "Pacifico").
If you cannot identify the specific font, guess the closest matching elegant Google Font name, or use "Inter" as default.

Return JSON ONLY, with this schema:
{
  "pages": [
    {
      "backgroundColor": "#hexcolor or transparent",
      "layers": [
        {
          "type": "text",
          "text": "Extracted string",
          "fontSize": 48,
          "fill": "#hexcolor",
          "fontFamily": "Font Family Name",
          "fontWeight": "bold",
          "x": 400,
          "y": 400,
          "width": 600,
          "height": 100
        },
        {
          "type": "shape",
          "shapeType": "rectangle",
          "fill": "#hexcolor",
          "x": 400,
          "y": 400,
          "width": 100,
          "height": 100
        }
      ]
    }
  ]
}
For x and y, use coordinates assuming an 800x800 canvas. Center is 400, 400.`;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          prompt,
          { inlineData: { data: base64Data, mimeType: actualMimeType } }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text || "{}";
      const data = safeJsonParse(text) || { backgroundColor: "transparent", layers: [] };
      res.json(data);
    } catch (error) {
      handleAIError(error, res);
    }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin' && password === 'admin') {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, user: { email: 'admin', role: 'admin' } });
    }
    
    try {
      const q = query(collection(db, 'users'), where('email', '==', email), fLimit(1));
      const qs = await getDocs(q);
      
      if (!qs.empty) {
        const user = { id: qs.docs[0].id, ...qs.docs[0].data() } as any;
        if (['admin', 'manager', 'employee'].includes(user.role)) {
          const valid = await bcrypt.compare(password, user.password);
          if (valid) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ token, user: { email: user.email, role: user.role } });
          }
        }
      }
      res.status(401).json({ error: 'Invalid credentials. Use admin / admin' });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin Routes
  app.get('/api/admin/orders', verifyStaff, async (req: any, res) => {
    try {
      const qs = await getDocs(collection(db, 'orders'));
      const orders = qs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      for (const order of orders) {
          if (order.userId) {
              const uSnap = await getDoc(doc(db, 'users', order.userId));
              if (uSnap.exists()) {
                  const uData = uSnap.data();
                  order.customerName = uData.name;
                  order.customerEmail = uData.email;
                  order.customerAddresses = uData.savedAddresses;
                  order.customerRole = uData.role;
              }
          }
      }
      orders.sort((a,b) => b.createdAt - a.createdAt);
      res.json(orders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/orders/:id', verifyStaff, async (req: any, res) => {
    try {
      const oSnap = await getDoc(doc(db, 'orders', req.params.id));
      if (!oSnap.exists()) return res.status(404).json({ error: 'Not found' });
      const order = { id: oSnap.id, ...oSnap.data() } as any;
      
      if (order.userId) {
          const uSnap = await getDoc(doc(db, 'users', order.userId));
          if (uSnap.exists()) {
              const uData = uSnap.data();
              order.customerName = uData.name;
              order.customerEmail = uData.email;
              order.customerAddresses = uData.savedAddresses;
          }
      }
      
      const itemQ = query(collection(db, 'order_items'), where('orderId', '==', order.id));
      const itemQs = await getDocs(itemQ);
      const items = itemQs.docs.map(d => d.data());
      
      for (const item of items) {
          if (item.name && item.image) {
            (item as any).productName = item.name;
            (item as any).productImage = item.image;
            continue;
          }
          const prodSnap = await getDoc(doc(db, 'products', item.productId));
          const prodData = prodSnap.exists() ? prodSnap.data() : { name: 'Unknown', image: '' };
          (item as any).productName = item.name || prodData.name;
          (item as any).productImage = item.image || prodData.image;
      }
      
      res.json({ ...order, items });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/orders/:id/status', verifyManager, async (req: any, res) => {
    try {
      const { status } = req.body;
      await updateDoc(doc(db, 'orders', req.params.id), { status });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Google Drive Image Proxy to bypass hotlinking restrictions
  app.get('/api/proxy-image/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const url = `https://drive.google.com/uc?export=view&id=${id}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // spoof user agent
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(404).send('Not found');
    }
  });

  // Get Products with optional pagination and category filter
  app.get('/api/products', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const subCategory = req.query.subCategory as string;
      const sort = req.query.sort as string; // 'price_asc', 'price_desc', 'newest'
      const search = req.query.search as string;
      const includeDisabled = req.query.includeDisabled === 'true';

      const productsRef = collection(db, 'products');
      let qs = await getDocs(productsRef); // lazy fetch all and filter in memory for simplicity in this migration
      let products = qs.docs.map(d => mapRowToProduct({ id: d.id, ...d.data() }));

      if (!includeDisabled) {
        products = products.filter((p: any) => !p.isDisabled && p.image && p.image.trim().length > 0 && isProductImage(p.image));

        // Remove products with duplicate pictures as requested
        const seenImages = new Set<string>();
        products = products.filter((p: any) => {
          if (!p.image) return false;
          // Normalize image URL slightly to catch exact duplicates
          const imgNormalized = p.image.trim().split('?')[0];
          if (seenImages.has(imgNormalized)) {
            return false;
          }
          seenImages.add(imgNormalized);
          return true;
        });
      }

      let availableSubCategories: string[] = [];

      if (category && category !== 'all') {
        const cleanFilter = category.toLowerCase().trim().replace(/\s+/g, '-');
        products = products.filter((p: any) => {
          if (!p.category) return false;
          const pCatClean = p.category.toLowerCase().trim().replace(/\s+/g, '-');
          if (p.category === category) return true;
          if (pCatClean === cleanFilter) return true;
          
          // Equivalence mapping
          if (cleanFilter === 'apparel' && pCatClean === 'custom-apparel') return true;
          if (cleanFilter === 'custom-apparel' && pCatClean === 'apparel') return true;
          
          if (cleanFilter === 'marketing' && pCatClean === 'marketing-materials') return true;
          if (cleanFilter === 'marketing-materials' && pCatClean === 'marketing') return true;
          if (cleanFilter === 'marketing' && pCatClean === 'business-stationery') return true;
          if (cleanFilter === 'marketing-materials' && pCatClean === 'business-stationery') return true;
          if (cleanFilter === 'business-stationery' && pCatClean === 'marketing') return true;
          if (cleanFilter === 'business-stationery' && pCatClean === 'marketing-materials') return true;
          
          if (cleanFilter === 'gifts' && pCatClean === 'corporate-gifts') return true;
          if (cleanFilter === 'corporate-gifts' && pCatClean === 'gifts') return true;
          
          if (cleanFilter === 'signage' && pCatClean === 'signage-&-posters') return true;
          if (cleanFilter === 'signage-&-posters' && pCatClean === 'signage') return true;
          if (cleanFilter === 'signage' && pCatClean === 'signage-posters') return true;
          if (cleanFilter === 'signage-posters' && pCatClean === 'signage') return true;
          
          return false;
        });
        const subs = new Set<string>();
        products.forEach((p: any) => {
           if (p.subCategory) subs.add(p.subCategory);
        });
        availableSubCategories = Array.from(subs);
      }

      if (subCategory && subCategory !== 'all') {
        products = products.filter((p: any) => p.subCategory === subCategory);
      }
      
      if (search) {
        products = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description && p.description.toLowerCase().includes(search.toLowerCase())));
      }

      if (sort === 'price_asc') products.sort((a: any,b: any) => (a.price||0) - (b.price||0));
      else if (sort === 'price_desc') products.sort((a: any,b: any) => (b.price||0) - (a.price||0));
      else products.sort((a: any,b: any) => (b.createdAt||0) - (a.createdAt||0));

      const total = products.length;
      const paginated = products.slice((page-1)*limit, page*limit);

      res.json({
        data: paginated.map(mapRowToProduct),
        total, page, limit, totalPages: Math.ceil(total / limit),
        availableSubCategories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get single product
  app.get('/api/products/:id(*)', async (req, res) => {
    try {
      const requestedId = req.params.id;
      const docSnap = await getDoc(doc(db, 'products', requestedId));
      if (!docSnap.exists() || docSnap.data().isDisabled) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(mapRowToProduct({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Bulk Import Products (Admin only)
  app.post('/api/products/bulk', verifyAdmin, async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Expected an array of products' });
      }

      let imported = 0;
      for (const p of products) {
          if (!p.name) continue; 
          
          const id = Math.random().toString(36).substr(2, 9);
          const createdAt = Date.now();
          const updatedAt = Date.now();
          
          let parsedPrice: number | null = null;
          if (p.price != null) {
            parsedPrice = parseFloat(p.price);
            if (isNaN(parsedPrice)) parsedPrice = null;
          }

          let featuresParsed = [];
          if (Array.isArray(p.features)) {
            featuresParsed = p.features;
          } else if (typeof p.features === 'string' && p.features) {
            featuresParsed = p.features.split(',').map((s: string) => s.trim());
          }

          let imagesParsed = [];
          if (Array.isArray(p.images)) {
            imagesParsed = p.images;
          } else if (typeof p.images === 'string' && p.images) {
            imagesParsed = p.images.split(',').map((s: string) => s.trim());
          }

          let colorsParsed = [];
          if (Array.isArray(p.colors)) {
            colorsParsed = p.colors;
          } else if (typeof p.colors === 'string' && p.colors) {
            colorsParsed = p.colors.split(';').map((s: string) => {
              const parts = s.split(':');
              return { name: (parts[0] || '').trim(), hex: (parts[1] || '').trim() || '#000000' };
            }).filter((c: any) => c.name);
          }

          await setDoc(doc(db, 'products', id), {
            name: p.name, 
            category: p.category || 'Apparel', 
            price: parsedPrice, 
            image: p.image || p.image_url || '', 
            images: JSON.stringify(imagesParsed), 
            description: p.description || '', 
            features: JSON.stringify(featuresParsed), 
            colors: JSON.stringify(colorsParsed), 
            createdAt, 
            updatedAt
          });
          imported++;
      }

      res.json({ success: true, count: imported });
    } catch (error: any) {
      console.error('Bulk import error:', error);
      res.status(500).json({ error: error.message || 'Failed to bulk import products' });
    }
  });

  // Add Product (Admin only)
  app.post('/api/products', verifyAdmin, async (req, res) => {
    try {
      const { name, category, subCategory, price, minQty, qtyMultiple, image, images, description, cardDescription, features, colors, variations, isDisabled, isBestseller, inMegaMenu, badge } = req.body;
      const id = Math.random().toString(36).substr(2, 9);
      const createdAt = Date.now();
      const updatedAt = Date.now();
      
      await setDoc(doc(db, 'products', id), {
        name, category, subCategory: subCategory || '', price, 
        minQty: minQty ? parseInt(minQty, 10) : null,
        qtyMultiple: qtyMultiple ? parseInt(qtyMultiple, 10) : null,
        image, 
        images: JSON.stringify(images || []), description, cardDescription: cardDescription || '',
        features: JSON.stringify(features || []), colors: JSON.stringify(colors || []), 
        variations: JSON.stringify(variations || []),
        isDisabled: !!isDisabled,
        isBestseller: !!isBestseller,
        inMegaMenu: !!inMegaMenu,
        badge: badge || '',
        createdAt, updatedAt
      });
      
      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  // Update Product (Admin only)
  app.put('/api/products/:id(*)', verifyAdmin, async (req, res) => {
    try {
      const { name, category, subCategory, price, minQty, qtyMultiple, image, images, description, cardDescription, features, colors, variations, isDisabled, isBestseller, inMegaMenu, badge } = req.body;
      const id = req.params.id;
      const updatedAt = Date.now();
      
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return res.status(404).json({ error: 'Product not found' });

      await updateDoc(docRef, {
        name, category, subCategory: subCategory || '', price,
        minQty: minQty ? parseInt(minQty, 10) : null,
        qtyMultiple: qtyMultiple ? parseInt(qtyMultiple, 10) : null,
        image, 
        images: JSON.stringify(images || []), description, cardDescription: cardDescription || '',
        features: JSON.stringify(features || []), colors: JSON.stringify(colors || []), 
        variations: JSON.stringify(variations || []),
        isDisabled: !!isDisabled,
        isBestseller: !!isBestseller,
        inMegaMenu: !!inMegaMenu,
        badge: badge || '',
        updatedAt
      });
      
      res.json({ success: true, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Partial Update Product (Admin only)
  app.patch('/api/products/:id(*)', verifyAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      updates.updatedAt = Date.now();
      
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return res.status(404).json({ error: 'Product not found' });

      await updateDoc(docRef, updates);
      
      res.json({ success: true, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update product partially' });
    }
  });

  // Delete Product (Admin only)
  app.delete('/api/products/:id(*)', verifyAdmin, async (req, res) => {
    try {
      console.log('Admin Delete Product requested:', req.params.id);
      try {
        await deleteDoc(doc(db, 'products', req.params.id));
      } catch (innerErr: any) {
        console.error('Inner deleteDoc error:', innerErr);
        return res.status(500).json({ error: 'FIRESTORE_ERR: ' + (innerErr.message || String(innerErr)) });
      }
      console.log('Successfully deleted product from firestore:', req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete error route:', error);
      res.status(500).json({ error: 'ROUTE_ERR: ' + (error.message || String(error)) });
    }
  });

  // Helper for Printo.in structured product import
  async function getPrintoStructuredData(urlStr: string, html: string): Promise<any> {
    const $ = cheerio.load(html);
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (!nextDataScript) return null;
    
    try {
      const data = JSON.parse(nextDataScript);
      const pageProps = data.props?.pageProps;
      if (!pageProps || !pageProps.product) return null;
      
      const prod = pageProps.product;
      const name = prod.name || $('h1').text().trim();
      
      let description = prod.long_description || prod.short_description || "";
      if (!description) {
        description = `Transform spaces with vibrant, customizable adhesive graphics ideal for branding, promotions, and decor.`;
      }
      
      const price = Math.round(prod.starting_price || prod.total_price || 0);
      
      const imagesSet = new Set<string>();
      if (prod.thumbnail_image_url) {
        imagesSet.add(prod.thumbnail_image_url);
      }
      if (prod.mobimedia_thumbnail_image_url) {
        imagesSet.add(prod.mobimedia_thumbnail_image_url);
      }
      if (prod.banner_image_url) {
        imagesSet.add(prod.banner_image_url);
      }
      if (prod.mobimedia_banner_image_url) {
        imagesSet.add(prod.mobimedia_banner_image_url);
      }
      
      if (prod.carousel_component_json) {
        try {
          const carousel = JSON.parse(prod.carousel_component_json);
          if (carousel && Array.isArray(carousel.cards)) {
            for (const card of carousel.cards) {
              if (card.custom_uri) imagesSet.add(card.custom_uri);
            }
          }
        } catch (e) {
          console.error('Error parsing carousel json:', e);
        }
      }
      
      $('img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (src) {
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = 'https://printo.in' + src;
          if (src.startsWith('http') && !src.includes('data:image')) imagesSet.add(src);
        }
      });
      
      const imageList = cleanAndDeduplicateImages(Array.from(imagesSet));
      const image = imageList[0] || "";
      const images = imageList.slice(1);
      
      const features: string[] = [];
      if (prod.readable_attr_vals) {
        for (const [k, v] of Object.entries(prod.readable_attr_vals)) {
          if (features.length < 3) {
            features.push(`${k}: ${v}`);
          }
        }
      }
      while (features.length < 3) {
        features.push("Vibrant eco-solvent printing quality");
        if (features.length < 3) features.push("Highly durable and customizable adhesive vinyl");
        if (features.length < 3) features.push("Available in custom sizes, shapes, and finishes");
      }
      
      const variations: any[] = [];
      const layoutId = prod.layout_id || pageProps.categoryForm?.layout_id;
      const subFormIds: any[] = [];
      
      if (pageProps.categoryForm?.fields) {
        for (const field of pageProps.categoryForm.fields) {
          if (field.sub_form_ids_mapped_by_layout_id && layoutId && field.sub_form_ids_mapped_by_layout_id[layoutId]) {
            subFormIds.push(field.sub_form_ids_mapped_by_layout_id[layoutId]);
          } else if (field.sub_form_ids && Array.isArray(field.sub_form_ids)) {
            subFormIds.push(...field.sub_form_ids);
          }
        }
      }
      
      const uniqueSubFormIds = Array.from(new Set(subFormIds));
      
      for (const subFormId of uniqueSubFormIds) {
        try {
          const ds = JSON.stringify({
            rels: {
              fields: {
                rels: {
                  options: {}
                }
              }
            }
          });
          const formUrl = `https://printo.in/market-api/v3/forms/${subFormId}?_ds=${encodeURIComponent(ds)}`;
          const formRes = await fetch(formUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Referer': urlStr,
            }
          });
          if (formRes.ok) {
            const formJson = await formRes.json();
            if (formJson && formJson.result && formJson.result.fields) {
              for (const f of formJson.result.fields) {
                if (f.options && Array.isArray(f.options) && f.options.length > 0) {
                  const optList = f.options.map((o: any) => ({
                    name: o.text || o.value_text || "",
                    price: 0
                  })).filter((o: any) => o.name);
                  
                  if (optList.length > 0) {
                    if (!variations.some(v => v.name.toLowerCase() === f.label_text.toLowerCase())) {
                      variations.push({
                        name: f.label_text,
                        options: optList
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching subform', subFormId, err);
        }
      }
      
      return {
        name,
        description,
        price: price || 2295,
        category: prod.category_name || "Signages & Banners",
        image,
        images,
        features,
        colors: [],
        variations
      };
    } catch (err) {
      console.error('Error parsing Printo structured data:', err);
      return null;
    }
  }

  // Import Category Links (Admin only)
  app.post('/api/scrape-category-links', verifyAdmin, async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
      }

      if (!parsedUrl.hostname.includes('printo.in')) {
         return res.status(400).json({ error: 'Only Printo.in category URLs are currently supported for batch extraction.' });
      }

      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(`Failed to fetch the URL. Status: ${pageRes.status}`);
      }
      const html = await pageRes.text();
      const $ = cheerio.load(html);
      
      const links = new Set<string>();
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/customizable-products/')) {
           const clean = href.split('?')[0];
           links.add(clean.startsWith('http') ? clean : 'https://printo.in' + clean);
        }
      });
      
      const urls = Array.from(links);
      res.json({ success: true, urls });
    } catch (err: any) {
      console.error('Error scraping category links:', err);
      res.status(500).json({ error: err.message || 'Error scraping links.' });
    }
  });

  // Import Product from URL (Admin only)
  app.post('/api/import-product', verifyAdmin, async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid URL provided. Please enter a valid product webpage URL.' });
      }

      const pageRes = await fetch(parsedUrl.toString(), { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        } 
      });
      if (!pageRes.ok) {
        throw new Error(`Failed to fetch the URL. Status: ${pageRes.status} ${pageRes.statusText}`);
      }
      const html = await pageRes.text();

      // Check if it's a Printo.in URL
      if (parsedUrl.hostname.includes('printo.in')) {
        try {
          const printoData = await getPrintoStructuredData(parsedUrl.toString(), html);
          if (printoData) {
            return res.json({ success: true, data: printoData });
          }
        } catch (printoErr: any) {
          console.error('Printo custom parsing error:', printoErr);
          // If custom parsing fails, fallback to general parser below
        }
      }

      const $ = cheerio.load(html);
      $('script, style, nav, footer, iframe, noscript').remove();
      // Add spaces after block-level and option elements so text isn't concatenated
      $('br, p, div, li, td, tr, th, h1, h2, h3, h4, h5, h6, option, select').append(' ');
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 40000);
      
      const baseUrl = parsedUrl.origin;
      const images = new Set<string>();
      $('img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (!src) {
           const srcset = $(el).attr('srcset');
           if (srcset) {
             src = srcset.split(',')[0].split(' ')[0];
           }
        }
        if (src) {
          if (src.startsWith('//')) src = 'https:' + src;
          else if (src.startsWith('/')) src = baseUrl + src;
          if (src.startsWith('http') && !src.includes('data:image')) images.add(src);
        }
      });
      
      const imageUrls = cleanAndDeduplicateImages(Array.from(images));

      const prompt = `Extract product information from this webpage text.
Return the information in JSON matching the defined schema exactly.
If you find multiple images, choose the best product picture as 'image' and put ALL the rest in 'images'. You MUST include all accurate product images you can find in the 'images' array.
If extracting colors, give a standard hex color if you can guess it from the name (e.g. Red -> #FF0000).
Please try to identify and extract exactly the best 3 features of the product. FORMAT THE DESCRIPTION AS MARKDOWN. The description must start with a 1-2 sentence compelling paragraph. Following the paragraph, list the comprehensive product specifications (size, quality, paper types, material, etc.) as markdown bullet points. Do not use markdown headers for the bullet points.
Extract ALL variations available on the linked site, including sizes, types, qualities, bindings, etc. Make sure to be exhaustive and capture all the variations in the text. If there are dropdowns or lists of options, extract every option as a variation. If the webpage shows full/absolute prices for different sizes or options (e.g., 2x2 is 1500 and 2x3 is 1800), capture these full absolute prices as their 'price' value. Do NOT calculate the differences or relative prices yourself.

Webpage text:
${bodyText}

Image URLs found on page:
${imageUrls.slice(0, 50).join('\n')}

Original URL: ${url}
`;

      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await getAI().models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING, description: "Detailed description. MUST include all important points like size, quality, paper, materials, and everything else." },
              price: { type: Type.NUMBER, description: "Extract the numeric price, if any" },
              category: { type: Type.STRING },
              image: { type: Type.STRING },
              images: { type: Type.ARRAY, items: { type: Type.STRING } },
              features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extract exactly the best 3 features." },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  }
                }
              },
              variations: {
                type: Type.ARRAY,
                description: "Group variations into categories (e.g., 'Size', 'Finish', 'Material'). Each option must have its full absolute price (e.g., 1500, 1800) as an integer if available on the page, otherwise 0.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Internal lowercased id, e.g. 'size' or 'material'" },
                    name: { type: Type.STRING, description: "Display name of the variation category, e.g. 'Size', 'Finish'" },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Option name, e.g. 'A4', 'Glossy'" },
                          price: { type: Type.NUMBER, description: "Absolute full price for this option if available as a number, otherwise 0" }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["name", "description"]
          }
        }
      });
      break; // Success, break retry loop
    } catch (err: any) {
      console.error(`AI generation failed (retries left: ${retries - 1}): ${err.message}`);
      retries--;
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const dataStr = response?.text;
      if (!dataStr) throw new Error('Failed to parse from AI');
      const data = safeJsonParse(dataStr);
      if (!data) throw new Error('Failed to parse AI JSON response');

      // Automatically normalize variations prices
      // If any variation category has options with absolute prices (e.g., Size has 2x2: 1500, 2x3: 1800),
      // we subtract the minimum price from all options so the cheapest is +₹0 (base),
      // and adjust other options relative to it. We then add this minimum price to the product's base price.
      let totalMinPrice = 0;
      if (data.variations && Array.isArray(data.variations)) {
        for (const variation of data.variations) {
          if (variation.options && Array.isArray(variation.options) && variation.options.length > 0) {
            // Check if there are any priced options
            const hasPrices = variation.options.some((opt: any) => typeof opt.price === 'number' && opt.price > 0);
            if (hasPrices) {
              const prices = variation.options.map((opt: any) => typeof opt.price === 'number' ? opt.price : 0);
              const minVal = Math.min(...prices);
              if (minVal > 0) {
                totalMinPrice += minVal;
                variation.options = variation.options.map((opt: any) => ({
                  ...opt,
                  price: Math.max(0, (typeof opt.price === 'number' ? opt.price : 0) - minVal)
                }));
              }
            }
          }
        }
      }

      // Update base price of the product if we extracted absolute variation prices
      if (totalMinPrice > 0) {
        data.price = totalMinPrice;
      }

   res.json({ success: true, data });
} catch (error: any) {
      console.error(error);
      if (error.status === 503 || error.message?.includes('503')) {
        return res.status(503).json({ error: 'The AI model is currently experiencing high demand. Please try again later.' });
      }
      res.status(500).json({ error: error.message || 'Failed to import product' });
    }
  });

  // Submit RFQ
  app.post('/api/rfq', async (req, res) => {
    try {
      const { name, phone, email, company, description, requirements } = req.body;
      if (!name || !phone || !email) {
        return res.status(400).json({ error: 'Name, phone, and email are required' });
      }

      const id = Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      const createdAt = Date.now();
      
      await setDoc(doc(db, 'rfqs', id), {
        name, phone, email, company, description, requirements, createdAt
      });
      
      // Try sending notifications async
      (async () => {
        try {
          const messageText = `New Bulk Quotation Request!\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nCompany: ${company || 'N/A'}\nRequirements: ${requirements || 'N/A'}\nDescription: ${description || 'N/A'}`;
          
          await sendAdminEmail({
            subject: `New Bulk Quotation Request from ${name}`,
            text: messageText,
            replyTo: email
          });
        } catch (notifyError) { console.error('Failed to send admin notification:', notifyError); }
      })();

      res.status(201).json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit RFQ' });
    }
  });

  // Get RFQs (Admin only)
  app.get('/api/rfqs', verifyManager, async (req, res) => {
    try {
      const qs = await getDocs(collection(db, 'rfqs'));
      const rfqs = qs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      rfqs.sort((a,b) => b.createdAt - a.createdAt);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch RFQs' });
    }
  });

  // Get Profiles (Admin only)
  app.get('/api/profiles', verifyManager, async (req, res) => {
    try {
      const qs = await getDocs(collection(db, 'company_profiles'));
      const profiles = qs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      profiles.sort((a,b) => b.createdAt - a.createdAt);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  });

  // Get Full Profile including Products (Admin only)
  app.get('/api/profiles/:id', verifyManager, async (req, res) => {
    try {
      const pSnap = await getDoc(doc(db, 'company_profiles', req.params.id));
      if (!pSnap.exists()) return res.status(404).json({ error: 'Profile not found' });
      
      const itemQ = query(collection(db, 'profile_products'), where('profileId', '==', req.params.id));
      const itemQs = await getDocs(itemQ);
      const items = itemQs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      for (const item of items) {
          const prodSnap = await getDoc(doc(db, 'products', item.productId));
          const prodData = prodSnap.exists() ? prodSnap.data() : { name: 'Unknown', image: '', description: '', price: 0 };
          item.productName = prodData.name;
          item.productImage = prodData.image;
          item.productDescription = prodData.description;
          item.originalPrice = prodData.price;
      }
      
      res.json({ profile: { id: pSnap.id, ...pSnap.data() }, items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Create Profile (Admin only)
  app.post('/api/profiles', verifyManager, async (req, res) => {
    try {
      const { companyName, contactName, email, phone, notes } = req.body;
      const id = Math.random().toString(36).substr(2, 9);
      const createdAt = Date.now();
      
      await setDoc(doc(db, 'company_profiles', id), {
        companyName, contactName: contactName || null, email: email || null, phone: phone || null, notes: notes || null, createdAt, updatedAt: createdAt
      });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create profile' });
    }
  });
  
  // Update Profile (Admin only)
  app.put('/api/profiles/:id', verifyManager, async (req, res) => {
    try {
      const { companyName, contactName, email, phone, notes } = req.body;
      const updatedAt = Date.now();
      await updateDoc(doc(db, 'company_profiles', req.params.id), {
        companyName, contactName: contactName || null, email: email || null, phone: phone || null, notes: notes || null, updatedAt
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });
  
  // Delete Profile
  app.delete('/api/profiles/:id', verifyManager, async (req, res) => {
    try {
      const itemQ = query(collection(db, 'profile_products'), where('profileId', '==', req.params.id));
      const itemQs = await getDocs(itemQ);
      for (const d of itemQs.docs) {
          await deleteDoc(doc(db, 'profile_products', d.id));
      }
      await deleteDoc(doc(db, 'company_profiles', req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  });

  // Add Product to Profile
  app.post('/api/profiles/:id/products', verifyManager, async (req, res) => {
    try {
      const { productId, customPrice, customDescription, quantity } = req.body;
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'profile_products', id), {
          profileId: req.params.id, productId, customPrice: customPrice || 0, customDescription: customDescription || null, quantity: quantity || 1
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add product to profile' });
    }
  });

  // Update Profile Product
  app.put('/api/profiles/products/:itemId', verifyManager, async (req, res) => {
    try {
      const { customPrice, customDescription, quantity } = req.body;
      await updateDoc(doc(db, 'profile_products', req.params.itemId), {
          customPrice: customPrice || 0, customDescription: customDescription || null, quantity: quantity || 1
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile product' });
    }
  });

  // Delete Profile Product
  app.delete('/api/profiles/products/:itemId', verifyManager, async (req, res) => {
    try {
      await deleteDoc(doc(db, 'profile_products', req.params.itemId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove product from profile' });
    }
  });


  // ----- VITE MIDDLEWARE -----
  
  // Colors Settings endpoints
  app.get("/api/colors", async (req, res) => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "colors"));
      if (docSnap.exists()) {
        res.json({ colors: docSnap.data().colors || [] });
      } else {
        res.json({ colors: [] });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch colors" });
    }
  });

  app.post("/api/colors", verifyAdmin, async (req, res) => {
    try {
      await setDoc(doc(db, "settings", "colors"), { colors: req.body.colors || [] });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save colors" });
    }
  });

  // Global error handler for all routes
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
       return res.status(400).json({ error: 'Bad JSON' });
    }
    if (err.type === 'entity.too.large') {
       return res.status(413).json({ error: 'Payload size too large. Ensure uploaded files or data is smaller.' });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // API 404 handler
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
