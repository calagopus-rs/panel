import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { adminNodeServerBackupSchema } from '@/lib/schemas/admin/nodes.ts';
import { parsePaginationFromApi } from '@/lib/serialization/api-transform.ts';

export default async (
  serverUuid: string,
  page: number,
  search?: string,
  partiallyDetached?: boolean,
): Promise<{ backups: Pagination<z.infer<typeof adminNodeServerBackupSchema>>; failed: number }> => {
  const { data } = await axiosInstance.get(`/api/admin/servers/${serverUuid}/backups`, {
    params: { page, search, partially_detached: partiallyDetached },
  });
  return {
    backups: parsePaginationFromApi(adminNodeServerBackupSchema, data.backups),
    failed: data.failed,
  };
};
