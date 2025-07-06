import { axiosInstance } from '@/api/axios';
import { TwoFactorSetupResponse } from '@/pages/dashboard/account/actions/SetupTwoFactorButton';

export default async (): Promise<TwoFactorSetupResponse> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/two-factor`)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
