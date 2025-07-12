import { axiosInstance } from '@/api/axios';

export default async (uuid: string, root: string, files: string[]): Promise<DirectoryEntry> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(
        `/api/client/servers/${uuid}/files/compress`,
        { root, files },
        {
          timeout: 60000,
          timeoutErrorMessage:
            'It looks like this archive is taking a long time to generate. It will appear once completed.',
        },
      )
      .then(({ data }) => resolve(data.entry))
      .catch(reject);
  });
};
