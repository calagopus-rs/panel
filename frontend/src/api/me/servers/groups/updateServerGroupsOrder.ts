import { axiosInstance } from '@/api/axios.ts';

export default async (order: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/client/servers/groups/order', { server_group_order: order })
      .then(() => resolve())
      .catch(reject);
  });
};
