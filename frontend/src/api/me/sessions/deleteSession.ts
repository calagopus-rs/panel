import { axiosInstance } from '@/api/axios.ts';

export default async (sessionUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/sessions/${sessionUuid}`)
      .then(() => resolve())
      .catch(reject);
  });
};
