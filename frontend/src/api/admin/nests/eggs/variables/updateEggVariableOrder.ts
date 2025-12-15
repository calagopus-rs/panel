import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, eggUuid: string, order: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables/order`, { variable_order: order })
      .then(() => resolve())
      .catch(reject);
  });
};
