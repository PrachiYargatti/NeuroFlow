import crypto from 'crypto';

const collections = new Map();

function now() {
  return new Date().toISOString();
}

function getCollection(name) {
  if (!collections.has(name)) {
    collections.set(name, []);
  }
  return collections.get(name);
}

function matches(item, filter = {}) {
  return Object.entries(filter).every(([key, value]) => {
    if (Array.isArray(value)) {
      return value.includes(item[key]);
    }
    return item[key] === value;
  });
}

function sortItems(items, sort = {}) {
  const entries = Object.entries(sort);
  if (!entries.length) {
    return items;
  }

  return [...items].sort((a, b) => {
    for (const [key, direction] of entries) {
      if (a[key] === b[key]) continue;
      return a[key] > b[key] ? direction : -direction;
    }
    return 0;
  });
}

export function createMemoryRepository() {
  return {
    mode: 'memory',

    async getAll(collection, filter = {}, sort = {}) {
      return sortItems(getCollection(collection).filter((item) => matches(item, filter)), sort);
    },

    async getById(collection, id) {
      return getCollection(collection).find((item) => item.id === id) || null;
    },

    async getOne(collection, filter = {}) {
      return getCollection(collection).find((item) => matches(item, filter)) || null;
    },

    async create(collection, data) {
      const item = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: now(),
        updatedAt: now()
      };
      getCollection(collection).push(item);
      return item;
    },

    async updateById(collection, id, updates) {
      const items = getCollection(collection);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      items[index] = { ...items[index], ...updates, updatedAt: now() };
      return items[index];
    },

    async upsert(collection, filter, createData, updateData) {
      const existing = await this.getOne(collection, filter);
      if (existing) {
        return this.updateById(collection, existing.id, updateData);
      }
      return this.create(collection, { ...filter, ...createData });
    },

    async deleteById(collection, id) {
      const items = getCollection(collection);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return false;
      }
      items.splice(index, 1);
      return true;
    },

    async deleteWhere(collection, filter = {}) {
      const items = getCollection(collection);
      const kept = items.filter((item) => !matches(item, filter));
      const deleted = items.length - kept.length;
      collections.set(collection, kept);
      return deleted;
    },

    async count(collection, filter = {}) {
      return getCollection(collection).filter((item) => matches(item, filter)).length;
    }
  };
}
