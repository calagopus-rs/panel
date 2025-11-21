import { axiosInstance } from '@/api/axios';

export default async (step: OobeStepKey): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        oobe_step: step,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
