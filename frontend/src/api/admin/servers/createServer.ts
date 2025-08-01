import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface CreateServerData {
  nodeId: number;
  ownerId: number;
  eggId: number;
  allocationId?: number;
  allocationIds: number[];
  startOnCompletion: boolean;
  skipScripts: boolean;
  externalId?: string;
  name: string;
  description?: string;
  limits: {
    cpu: number;
    memory: number;
    swap: number;
    disk: number;
    ioWeight: number;
  };
  pinnedCpus: number[];
  startup: string;
  image: string;
  timezone?: string;
  featureLimits: {
    allocations: number;
    databases: number;
    backups: number;
  };
}

export default async (data: CreateServerData): Promise<AdminServer> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/admin/servers', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.server))
      .catch(reject);
  });
};
