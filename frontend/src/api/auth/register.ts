import { axiosInstance } from '@/api/axios';

interface Data {
  username: string;
  email: string;
  name_first: string;
  name_last: string;
  password: string;
  captcha?: string;
}

interface Response {
  user: User;
}

export default async ({ username, email, name_first, name_last, password, captcha }: Data): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/register', { username, email, name_first, name_last, password, captcha })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
