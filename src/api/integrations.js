import { base44 } from './base44Client';

// Only file uploads run from the browser. Every other integration
// (email, AI, image generation, data extraction) is called from
// backend functions so integration credits can't be spent from the client.
export const UploadFile = base44.integrations.Core.UploadFile;

export const UploadPrivateFile = base44.integrations.Core.UploadPrivateFile;