import { axiosInstance } from '@/api/axios';

export default async (sessionId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/client/account/sessions/${sessionId}`)
      .then(() => resolve())
      .catch(reject);
  });
};
