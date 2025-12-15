import { axiosInstance } from '@/api/axios.ts';

interface Props {
  uuid: string;
  root: string;
  files: {
    file: string;
    mode: string;
  }[];
}

export default async ({ uuid, root, files }: Props): Promise<{ updated: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/files/chmod`, { root, files })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
