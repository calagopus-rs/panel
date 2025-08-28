import { axiosInstance } from '@/api/axios';

function prepareCredentialOptions(options: CredentialCreationOptions): CredentialCreationOptions {
  function base64ToArrayBuffer(base64String: string): ArrayBuffer {
    let paddedBase64 = base64String;
    while (paddedBase64.length % 4 !== 0) {
      paddedBase64 += '=';
    }

    paddedBase64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');

    try {
      const binaryString = window.atob(paddedBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes.buffer;
    } catch (error) {
      console.error('Error decoding base64 string:', error);
      console.error('Problematic string:', base64String);
      throw new Error('Failed to decode base64 string: ' + error.message);
    }
  }

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

export default async (name: string): Promise<[UserSecurityKey, CredentialCreationOptions]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/client/account/security-keys', { name })
      .then(({ data }) => resolve([data.securityKey, prepareCredentialOptions(data.options)]))
      .catch(reject);
  });
};
