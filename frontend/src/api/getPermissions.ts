import { axiosInstance } from '@/api/axios';

interface Response {
  subuserPermissions: PermissionData;
}

export default async (): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/permissions')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
