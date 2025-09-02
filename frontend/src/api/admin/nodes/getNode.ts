import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string): Promise<Node> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${nodeUuid}`)
      .then(({ data }) => resolve(data.node))
      .catch(reject);
  });
};
