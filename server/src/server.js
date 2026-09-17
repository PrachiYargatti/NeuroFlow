import { env } from './config/env.js';
import { createApp } from './app.js';
import { initRepository } from './data/repository.js';
import { seedDemoData } from './data/seed.js';

const repository = await initRepository();
await seedDemoData(repository);

const app = createApp();

app.listen(env.port, () => {
  console.log(`NeuroFlow API running on http://localhost:${env.port}/api`);
  console.log(`Repository mode: ${repository.mode}`);
});
