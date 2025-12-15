import { axiosInstance } from '@/api/axios.ts';

interface Data {
  permissions: string[];
  ignoredFiles: string[];
}

export default async (uuid: string, subuser: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/subusers/${subuser}`, {
        permissions: data.permissions,
        ignored_files: data.ignoredFiles,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
