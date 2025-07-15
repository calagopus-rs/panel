import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  ignoredFiles: string[];
}

export default async (uuid: string, data: Data): Promise<ServerBackup> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/backups`, {
        name: data.name,
        ignored_files: data.ignoredFiles,
      })
      .then(({ data }) => resolve(data.backup))
      .catch(reject);
  });
};
