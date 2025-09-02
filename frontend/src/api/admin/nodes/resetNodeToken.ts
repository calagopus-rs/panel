import { axiosInstance } from '@/api/axios';

export default async (nodeUuid: string): Promise<{ tokenId: string; token: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nodes/${nodeUuid}/reset-token`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
