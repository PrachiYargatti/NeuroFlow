import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { createMemoryRepository } from './memoryRepository.js';
import { createMongoRepository } from './mongoRepository.js';

let repository = createMemoryRepository();

export async function initRepository() {
  if (!env.mongodbUri) {
    repository = createMemoryRepository();
    return repository;
  }

  try {
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 2500 });
    repository = createMongoRepository();
  } catch (error) {
    console.warn(`MongoDB unavailable, using memory repository: ${error.message}`);
    repository = createMemoryRepository();
  }

  return repository;
}

export function getRepository() {
  return repository;
}
