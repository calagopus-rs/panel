import { axiosInstance } from '@/api/axios';

function prepareCredentialOptions(options: CredentialRequestOptions): CredentialRequestOptions {
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

  const publicKey = options.publicKey as PublicKeyCredentialRequestOptions;
  const processedPublicKey: PublicKeyCredentialRequestOptions = { ...publicKey };

  if (typeof publicKey.challenge === 'string') {
    processedPublicKey.challenge = base64ToArrayBuffer(publicKey.challenge);
  }

  if (publicKey.allowCredentials) {
    processedPublicKey.allowCredentials = publicKey.allowCredentials.map((credential) => {
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

interface Response {
  uuid: string;
  options: CredentialRequestOptions;
}

export default async (user: string): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/auth/login/security-key', { params: { user } })
      .then(({ data }) => resolve({ uuid: data.uuid, options: prepareCredentialOptions(data.options) }))
      .catch(reject);
  });
};
