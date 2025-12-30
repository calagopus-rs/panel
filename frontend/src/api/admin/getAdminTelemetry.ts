import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<object> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/admin/telemetry')
      .then(({ data }) => resolve(data.telemetry))
      .catch(reject);
  });
};
