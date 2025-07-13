import { axiosInstance } from '@/api/axios';
import { createSearchParams } from 'react-router';

export default async (uuid: string, path: string, isDirectory: boolean): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(
        `/api/client/servers/${uuid}/files/download?${createSearchParams({
          file: path,
          directory: isDirectory.toString(),
        })}`,
      )
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
