import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  format: ArchiveFormat;
  root: string;
  files: string[];
}

export default async (uuid: string, data: Data): Promise<DirectoryEntry> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(
        `/api/client/servers/${uuid}/files/compress`,
        { name: data.name, format: data.format, root: data.root, files: data.files },
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
