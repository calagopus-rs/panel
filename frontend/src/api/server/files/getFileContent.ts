import { axiosInstance } from '@/api/axios';

export async function getFileContent(uuid: string, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/files/contents`, {
        params: { file: path },
        responseType: 'text',
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
}
