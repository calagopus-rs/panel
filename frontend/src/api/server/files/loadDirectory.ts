import { FileObject } from '@/api/types';
import { axiosInstance } from '@/api/axios';
import { rawDataToFileObject } from '@/api/transformers';

export default async (uuid: string, directory?: string): Promise<FileObject[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory: directory ?? '/' },
      })
      .then(({ data }) => resolve((data.data || []).map((datum: any) => rawDataToFileObject(datum))))
      .catch(reject);
  });
};
