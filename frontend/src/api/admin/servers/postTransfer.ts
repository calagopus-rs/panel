import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  nodeUuid: string;
  allocationUuid: string | null;
  allocationUuids: string[];
  backups: string[];
  deleteSourceBackups: boolean;
  archiveFormat: ArchiveFormat;
  compressionLevel: CompressionLevel;
  multiplexChannels: number;
}

export default async (serverUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/servers/${serverUuid}/transfer`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
