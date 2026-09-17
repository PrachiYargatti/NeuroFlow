import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#2563eb' }
  },
  { timestamps: true }
);

export const Workspace = mongoose.model('Workspace', workspaceSchema);
