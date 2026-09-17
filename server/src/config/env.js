import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_neuroflow_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaChatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  seedSampleData: process.env.SEED_SAMPLE_DATA !== 'false'
};
