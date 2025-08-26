import { axiosInstance } from '@/api/axios';

export default async (
  uuid: string,
  backupUuid: string,
  archiveFormat: StreamingArchiveFormat,
): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/backups/${backupUuid}/download`, { params: { archive_format: archiveFormat } })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
