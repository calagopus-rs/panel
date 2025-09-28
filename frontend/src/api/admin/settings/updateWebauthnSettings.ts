import { axiosInstance } from '@/api/axios';

export default async (data: AdminSettings['webauthn']): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        webauthn: {
          rp_id: data.rpId,
          rp_origin: data.rpOrigin,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
