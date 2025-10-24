import { axiosInstance } from '@/api/axios';

export default async (apiKeyUuid: string, data: UpdateUserApiKey): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/account/api-keys/${apiKeyUuid}`, {
        ...data,
        user_permissions: Array.from(data.userPermissions),
        admin_permissions: Array.from(data.adminPermissions),
        server_permissions: Array.from(data.serverPermissions),
      })
      .then(() => resolve())
      .catch(reject);
  });
};
