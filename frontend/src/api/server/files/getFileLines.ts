import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serverFileLinesSchema } from '@/lib/schemas/server/files.ts';
import { parseFromApi } from '@/lib/serialization/api-transform.ts';

export default async (
  uuid: string,
  file: string,
  startLine: number,
  endLine: number,
): Promise<z.infer<typeof serverFileLinesSchema>> => {
  const { data } = await axiosInstance.get(`/api/client/servers/${uuid}/files/lines`, {
    params: { file, start_line: startLine, end_line: endLine },
  });
  return parseFromApi(serverFileLinesSchema, data);
};
