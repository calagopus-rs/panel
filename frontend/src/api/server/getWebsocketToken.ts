import { axiosInstance } from '@/api/axios';

interface Response {
  token: string;
  socket: string;
}

export default async (uuid: string): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/websocket`)
      .then(({ data }) =>
        resolve({
          token: data.token,
          socket: data.url,
        }),
      )
      .catch(reject);
  });
};
