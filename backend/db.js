/**
 * MongoDB connection and cases collection helpers.
 * Used only for the case list (GET /api/cases, save-agent-data, save-sdk-data).
 * Full session/SDK data stays in memory + file.
 */
const { MongoClient } = require("mongodb");

const DB_NAME = "bargad";
const COLLECTION_NAME = "cases";

let client = null;
let collection = null;

async function getCollection() {
  if (collection) return collection;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ [MONGODB] MONGODB_URI not set; case list will not persist to DB.");
    return null;
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);
    console.log("✅ [MONGODB] Connected to database:", DB_NAME);
    return collection;
  } catch (err) {
    console.warn("⚠️ [MONGODB] Connect failed:", err.message);
    return null;
  }
}

/**
 * Get all cases sorted by createdAt descending (newest first).
 * @returns {Promise<Array<{ sessionId, leadNo, name, date, status, createdAt }>>}
 */
async function getAllCases() {
  const col = await getCollection();
  if (!col) return [];
  try {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({
      sessionId: d.sessionId || d._id,
      leadNo: d.leadNo,
      name: d.name,
      date: d.date,
      status: d.status,
      caseNumber: d.caseNumber,
      createdAt: d.createdAt,
    }));
  } catch (err) {
    console.warn("⚠️ [MONGODB] getAllCases failed:", err.message);
    return [];
  }
}

/**
 * Insert or update one case by sessionId.
 * @param {string} sessionId
 * @param {{ leadNo: string, name: string, date: string, status: string }} payload
 */
async function upsertCase(sessionId, payload) {
  const col = await getCollection();
  if (!col) return;
  try {
    const now = Date.now();
    await col.updateOne(
      { _id: sessionId },
      {
        $set: {
          sessionId,
          leadNo: payload.leadNo || "N/A",
          name: payload.name || "Unknown",
          date: payload.date || new Date(now).toLocaleDateString("en-GB"),
          status: payload.status || "Pending",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn("⚠️ [MONGODB] upsertCase failed:", err.message);
  }
}

/**
 * Update only the status of a case (e.g. to 'Completed' when SDK data is saved).
 * @param {string} sessionId
 * @param {string} status
 */
async function updateCaseStatus(sessionId, status) {
  const col = await getCollection();
  if (!col) return;
  try {
    await col.updateOne(
      { _id: sessionId },
      { $set: { status, updatedAt: Date.now() } }
    );
  } catch (err) {
    console.warn("⚠️ [MONGODB] updateCaseStatus failed:", err.message);
  }
}

module.exports = { getCollection, getAllCases, upsertCase, updateCaseStatus };
