import { axiosInstance } from '@/api/axios';

export default async (node: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nodes/${node}`)
      .then(() => resolve())
      .catch(reject);
  });
};
