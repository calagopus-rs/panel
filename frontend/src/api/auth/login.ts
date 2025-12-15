import { axiosInstance } from '@/api/axios.ts';

interface Data {
  user: string;
  password: string;
  captcha: string | null;
}

interface Response {
  user?: User;
  token?: string;
  type: 'completed' | 'two_factor_required';
}

export default async ({ user, password, captcha }: Data): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/login', { user, password, captcha })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
