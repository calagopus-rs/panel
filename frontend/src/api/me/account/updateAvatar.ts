import { axiosInstance } from '@/api/axios.ts';

export default async (data: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/client/account/avatar', data, {
        headers: {
          'Content-Type': data.type,
        },
      })
      .then(({ data }) => resolve(data.avatar))
      .catch(reject);
  });
};
