import { axiosInstance } from '@/api/axios';

export default async (uuid: string, directory: string): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/upload`)
      .then(({ data }) => resolve({ url: data.url + `&directory=${encodeURIComponent(directory)}` }))
      .catch(reject);
  });
};
