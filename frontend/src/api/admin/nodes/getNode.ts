import { axiosInstance } from '@/api/axios';

export default async (node: number): Promise<Node> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/nodes/${node}`)
      .then(({ data }) => resolve(data.node))
      .catch(reject);
  });
};
