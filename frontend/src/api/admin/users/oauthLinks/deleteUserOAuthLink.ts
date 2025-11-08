import { axiosInstance } from '@/api/axios';

export default async (userUuid: string, oauthLinkUuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .delete(`/api/admin/users/${userUuid}/oauth-links/${oauthLinkUuid}`)
      .then(({ data }) => resolve(data.oauthLink))
      .catch(reject);
  });
};
