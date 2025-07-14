import { axiosInstance } from '@/api/axios';

export default async (): Promise<PermissionData> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/permissions`)
      .then(({ data }) => resolve(data.permissions))
      .catch(reject);
  });
};
