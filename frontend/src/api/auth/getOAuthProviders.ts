import { axiosInstance } from '@/api/axios.ts';

export default async (): Promise<OAuthProvider[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/auth/oauth')
      .then(({ data }) => resolve(data.oauthProviders))
      .catch(reject);
  });
};
