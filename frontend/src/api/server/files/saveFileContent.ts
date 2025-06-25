import { axiosInstance } from '@/api/axios';

export async function saveFileContent(uuid: string, path: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/write`, content, {
        params: { file: path },
        headers: {
          'Content-Type': 'text/plain',
        },
      })
      .then(() => resolve())
      .catch(error => {
        reject(error);
      });
  });
}
