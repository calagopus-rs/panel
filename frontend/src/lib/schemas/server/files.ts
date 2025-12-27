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

export const serverFilesSearchSchema = z.object({
  pathFilter: z
    .object({
      include: z.string().array(),
      exclude: z.string().array(),
      caseInsensitive: z.boolean(),
    })
    .nullable(),
  sizeFilter: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .nullable(),
  contentFilter: z
    .object({
      query: z.string().min(1),
      maxSearchSize: z.number().min(0),
      includeUnmatched: z.boolean(),
      caseInsensitive: z.boolean(),
    })
    .nullable(),
});
