import { axiosInstance } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<Node>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/nodes', {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.nodes))
      .catch(reject);
  });
};
