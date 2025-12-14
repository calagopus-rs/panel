import { z } from 'zod';
import { archiveFormatLabelMapping } from '@/lib/enums.ts';

export const serverFilesArchiveCreateSchema = z.object({
  name: z.string().nullable(),
  format: z.enum(Object.keys(archiveFormatLabelMapping)),
});

export const serverFilesDirectoryCreateSchema = z.object({
  name: z.string(),
});

export const serverFilesCopySchema = z.object({
  name: z.string(),
});

export const serverFilesNameSchema = z.object({
  name: z.string(),
});

export const serverFilesPullSchema = z.object({
  url: z.url(),
  name: z.string().nullable(),
});
