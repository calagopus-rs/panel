import { axiosInstance } from '@/api/axios';

interface Props {
  uuid: string;
  root: string;
  files: {
    from: string;
    to: string;
  }[];
}

export default async ({ uuid, root, files }: Props): Promise<{ renamed: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/client/servers/${uuid}/files/rename`, { root, files })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
