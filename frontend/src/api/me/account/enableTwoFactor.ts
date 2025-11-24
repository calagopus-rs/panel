import { axiosInstance } from '@/api/axios';

interface Data {
  code: string;
  password: string;
}

interface Response {
  recoveryCodes: string[];
}

export default async (data: Data): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/two-factor', data)
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
