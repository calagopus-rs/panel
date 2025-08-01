import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  locationId?: number;
  name?: string;
  public?: boolean;
  description?: string;
  publicUrl?: string;
  url?: string;
  sftpHost?: string;
  sftpPort?: number;
  maintenanceMessage?: string;
  memory?: number;
  disk?: number;
}

export default async (node: number, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/admin/nodes/${node}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
