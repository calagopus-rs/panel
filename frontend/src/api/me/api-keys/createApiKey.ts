import { axiosInstance } from '@/api/axios';

interface Response {
  apiKey: UserApiKey;
  key: string;
}

export default async (data: UpdateUserApiKey): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/api-keys', {
        ...data,
        user_permissions: Array.from(data.userPermissions),
        admin_permissions: Array.from(data.adminPermissions),
        server_permissions: Array.from(data.serverPermissions),
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
