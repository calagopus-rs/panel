import { axiosInstance } from '@/api/axios';

export default async (roleUuid: string): Promise<Role> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/roles/${roleUuid}`)
      .then(({ data }) => resolve(data.role))
      .catch(reject);
  });
};
