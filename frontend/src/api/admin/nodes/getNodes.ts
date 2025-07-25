import { axiosInstance } from '@/api/axios';

interface GetNodesParams {
  page?: number;
  perPage?: number;
}

export default async (params: GetNodesParams = {}): Promise<ResponseMeta<Node>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/nodes', { params })
      .then(({ data }) => resolve(data.nodes))
      .catch(reject);
  });
};