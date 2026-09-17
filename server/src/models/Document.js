import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    fileType: { type: String, enum: ['pdf', 'docx', 'txt', 'md', 'csv', 'image'], required: true },
    status: { type: String, enum: ['uploaded', 'processing', 'ready', 'failed'], default: 'uploaded' },
    extractedText: { type: String, default: '' },
    summary: { type: String, default: '' },
    pageCount: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
    processingError: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
