import { axiosInstance } from '@/api/axios.ts';

export default async (userUuid: string, page: number, search?: string): Promise<ResponseMeta<UserOAuthLink>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/admin/users/${userUuid}/oauth-links`, {
        params: { page, search },
      })
      .then(({ data }) => resolve(data.oauthLinks))
      .catch(reject);
  });
};
