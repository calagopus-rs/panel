import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
}

export default async (securityKeyUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/account/security-keys/${securityKeyUuid}`, data)
      .then(() => resolve())
      .catch(reject);
  });
};
