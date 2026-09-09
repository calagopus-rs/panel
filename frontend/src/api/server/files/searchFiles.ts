import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import {
  serverDirectoryEntrySchema,
  serverFilesContentMatchesSchema,
  serverFilesSearchSchema,
} from '@/lib/schemas/server/files.ts';
import { parseFromApi, serializeForApi } from '@/lib/serialization/api-transform.ts';

const searchFilesSchema = serverFilesSearchSchema.extend({ root: z.string() });

const searchFilesResponseSchema = z.object({
  entries: serverDirectoryEntrySchema.array(),
  contentMatches: serverFilesContentMatchesSchema.array().optional(),
});

export default async (
  uuid: string,
  searchData: z.infer<typeof searchFilesSchema>,
): Promise<z.infer<typeof searchFilesResponseSchema>> => {
  const { data } = await axiosInstance.post(
    `/api/client/servers/${uuid}/files/search`,
    serializeForApi(searchFilesSchema, searchData),
  );
  return parseFromApi(searchFilesResponseSchema, data);
};
