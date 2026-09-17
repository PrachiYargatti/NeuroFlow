import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export async function seedDemoData(repository) {
  if (!env.seedSampleData) {
    return;
  }

  const existing = await repository.getOne('users', { email: 'demo@neuroflow.ai' });
  if (existing) {
    return;
  }

  const password = await bcrypt.hash('Password@123', 10);
  const user = await repository.create('users', {
    name: 'Demo User',
    email: 'demo@neuroflow.ai',
    password
  });

  const workspace = await repository.create('workspaces', {
    userId: user.id,
    name: 'Demo Intelligence Workspace',
    description: 'A seeded workspace for exploring NeuroFlow AI.',
    color: '#2563eb'
  });

  await repository.create('workflow_runs', {
    userId: user.id,
    workspaceId: workspace.id,
    type: 'summarize',
    status: 'completed',
    title: 'Demo summary',
    input: { prompt: 'Summarize the workspace.' },
    output: {
      summary: 'This demo workspace is ready for document intelligence workflows.',
      keyPoints: ['Upload files', 'Run grounded workflows', 'Review citations and traces']
    },
    citations: [],
    evaluation: { note: 'Seeded deterministic demo output.', confidence: 'medium' },
    trace: [{ stage: 'seed', status: 'completed', note: 'Created during startup.' }]
  });
}
