import { axiosInstance } from '@/api/axios.ts';

export default async (userUuid: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/users/${userUuid}`)
      .then(({ data }) => resolve(data.user))
      .catch(reject);
  });
};
