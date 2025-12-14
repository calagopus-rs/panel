import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { serverFilesArchiveCreateSchema } from '@/lib/schemas/server/files.ts';

type Data = z.infer<typeof serverFilesArchiveCreateSchema> & {
  root: string;
  files: string[];
};

export default async (uuid: string, data: Data): Promise<string> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/compress`, data, {
        timeout: 60000,
        timeoutErrorMessage:
          'It looks like this archive is taking a long time to generate. It will appear once completed.',
      })
      .then(({ data }) => resolve(data.identifier))
      .catch(reject);
  });
};
