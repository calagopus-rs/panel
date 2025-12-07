import { axiosInstance } from '@/api/axios';

interface Data {
  username: string;
  nameFirst: string;
  nameLast: string;
  language: string;
}

export default async (data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch('/api/client/account', {
        username: data.username,
        name_first: data.nameFirst,
        name_last: data.nameLast,
        language: data.language,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
