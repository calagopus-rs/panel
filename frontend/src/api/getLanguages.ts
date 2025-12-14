import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/languages')
      .then(({ data }) => resolve(data.languages))
      .catch(reject);
  });
};
