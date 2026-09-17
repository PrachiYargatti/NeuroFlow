import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    title: { type: String, required: true }
  },
  { timestamps: true }
);

export const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
