import { axiosInstance } from '@/api/axios.ts';

export default async (
  nodeUuid: string,
  backupUuid: string,
  archiveFormat: StreamingArchiveFormat,
): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}/backups/${backupUuid}/download`, { params: { archive_format: archiveFormat } })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
