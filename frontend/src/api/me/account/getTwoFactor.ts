import { axiosInstance } from '@/api/axios.ts';
import { TwoFactorSetupResponse } from '@/pages/dashboard/account/actions/TwoFactorSetupButton.tsx';

export default async (): Promise<TwoFactorSetupResponse> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/two-factor')
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
