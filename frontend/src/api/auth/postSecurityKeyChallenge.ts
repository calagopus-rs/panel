import { axiosInstance } from '@/api/axios.ts';
import { prepareCredentialForTransport } from '../me/security-keys/postSecurityKeyChallenge.ts';

interface Response {
  user: User;
}

export default async (uuid: string, challenge: PublicKeyCredential): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/login/security-key', {
        uuid,
        public_key_credential: prepareCredentialForTransport(challenge),
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
