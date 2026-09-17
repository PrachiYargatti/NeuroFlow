import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    tokenCountApprox: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
