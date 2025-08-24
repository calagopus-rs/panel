import { axiosInstance } from '@/api/axios';

export default async (uuid: string, root: string, file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(
        `/api/client/servers/${uuid}/files/decompress`,
        { root, file },
        {
          timeout: 60000,
          timeoutErrorMessage:
            'It looks like this archive is taking a long time to be unarchived. Once completed the unarchived files will appear.',
        },
      )
      .then(({ data }) => resolve(data.identifier))
      .catch(reject);
  });
};
