import { axiosInstance } from '@/api/axios';

export default async (data: CaptchaProvider): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        captcha_provider: data,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
