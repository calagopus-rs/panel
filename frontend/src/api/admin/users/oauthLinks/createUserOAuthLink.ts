import { axiosInstance } from '@/api/axios';

export default async (userUuid: string, oauthProviderUuid: string, identifier: string): Promise<UserOAuthLink> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/users/${userUuid}/oauth-links`, {
        oauth_provider_uuid: oauthProviderUuid,
        identifier,
      })
      .then(({ data }) => resolve(data.oauthLink))
      .catch(reject);
  });
};
