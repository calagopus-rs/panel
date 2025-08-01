import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  locationId: number;
  name: string;
  public: boolean;
  description?: string;
  publicUrl?: string;
  url: string;
  sftpHost?: string;
  sftpPort: number;
  memory: number;
  disk: number;
}

export default async (data: Data): Promise<Node> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/nodes', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.node))
      .catch(reject);
  });
};
