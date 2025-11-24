import { axiosInstance } from '@/api/axios';
import { base64ToArrayBuffer } from '@/lib/transformers';

function prepareCredentialOptions(options: CredentialCreationOptions): CredentialCreationOptions {
  if (!options.publicKey) {
    return options;
  }

  const publicKey = options.publicKey as PublicKeyCredentialCreationOptions;
  const processedPublicKey: PublicKeyCredentialCreationOptions = { ...publicKey };

  if (typeof publicKey.challenge === 'string') {
    processedPublicKey.challenge = base64ToArrayBuffer(publicKey.challenge);
  }

  if (publicKey.user && typeof publicKey.user.id === 'string') {
    processedPublicKey.user = {
      ...publicKey.user,
      id: base64ToArrayBuffer(publicKey.user.id),
    };
  }

  if (publicKey.excludeCredentials) {
    processedPublicKey.excludeCredentials = publicKey.excludeCredentials.map((credential) => {
      if (typeof credential.id === 'string') {
        return {
          ...credential,
          id: base64ToArrayBuffer(credential.id),
        };
      }
      return credential;
    });
  }

  return {
    ...options,
    publicKey: processedPublicKey,
  };
}

interface Data {
  name: string;
}

export default async (data: Data): Promise<[UserSecurityKey, CredentialCreationOptions]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/security-keys', data)
      .then(({ data }) => resolve([data.securityKey, prepareCredentialOptions(data.options)]))
      .catch(reject);
  });
};
