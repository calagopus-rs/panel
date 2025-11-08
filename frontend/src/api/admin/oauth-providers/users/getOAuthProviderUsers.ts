import { axiosInstance } from '@/api/axios';

export default async (
  oauthProviderUuid: string,
  page: number,
  search?: string,
): Promise<ResponseMeta<AdminUserOAuthLink>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/oauth-providers/${oauthProviderUuid}/users`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.userOauthLinks))
      .catch(reject);
  });
};
