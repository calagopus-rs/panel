import { axiosInstance } from '@/api/axios.ts';

export default async (nestUuid: string, eggUuid: string, destinationNestUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/move`, { destination_nest_uuid: destinationNestUuid })
      .then(() => resolve())
      .catch(reject);
  });
};
