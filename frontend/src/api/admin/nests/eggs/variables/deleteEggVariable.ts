import { axiosInstance } from '@/api/axios';

export default async (nestUuid: string, eggUuid: string, variableUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables/${variableUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
