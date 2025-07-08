import { axiosInstance } from '@/api/axios';

export default async (data: MailMode): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/settings`, {
        mail_mode: data,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
