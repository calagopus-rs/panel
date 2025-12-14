import { axiosInstance } from '@/api/axios.ts';

export default async (uuid: string, subuser: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/servers/${uuid}/subusers/${subuser}`)
      .then(() => resolve())
      .catch(reject);
  });
};
