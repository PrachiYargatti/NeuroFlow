import { ChatMessage, ChatThread, Document, DocumentChunk, User, WorkflowRun, Workspace } from '../models/index.js';

const models = {
  users: User,
  workspaces: Workspace,
  documents: Document,
  document_chunks: DocumentChunk,
  chat_threads: ChatThread,
  chat_messages: ChatMessage,
  workflow_runs: WorkflowRun
};

function normalize(doc) {
  if (!doc) {
    return null;
  }
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: String(obj._id), _id: undefined };
}

function normalizeFilter(filter = {}) {
  const normalized = { ...filter };
  if (normalized.id) {
    normalized._id = normalized.id;
    delete normalized.id;
  }
  return normalized;
}

function modelFor(collection) {
  const model = models[collection];
  if (!model) {
    throw new Error(`Unknown repository collection: ${collection}`);
  }
  return model;
}

export function createMongoRepository() {
  return {
    mode: 'mongo',

    async getAll(collection, filter = {}, sort = {}) {
      const docs = await modelFor(collection).find(normalizeFilter(filter)).sort(sort);
      return docs.map(normalize);
    },

    async getById(collection, id) {
      return normalize(await modelFor(collection).findById(id));
    },

    async getOne(collection, filter = {}) {
      return normalize(await modelFor(collection).findOne(normalizeFilter(filter)));
    },

    async create(collection, data) {
      return normalize(await modelFor(collection).create(data));
    },

    async updateById(collection, id, updates) {
      return normalize(await modelFor(collection).findByIdAndUpdate(id, updates, { new: true }));
    },

    async upsert(collection, filter, createData, updateData) {
      return normalize(
        await modelFor(collection).findOneAndUpdate(normalizeFilter(filter), {
          $set: updateData,
          $setOnInsert: createData
        }, {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        })
      );
    },

    async deleteById(collection, id) {
      const result = await modelFor(collection).findByIdAndDelete(id);
      return Boolean(result);
    },

    async deleteWhere(collection, filter = {}) {
      const result = await modelFor(collection).deleteMany(normalizeFilter(filter));
      return result.deletedCount;
    },

    async count(collection, filter = {}) {
      return modelFor(collection).countDocuments(normalizeFilter(filter));
    }
  };
}
