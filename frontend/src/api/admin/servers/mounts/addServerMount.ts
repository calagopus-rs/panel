import { axiosInstance } from '@/api/axios';

interface Data {
  mountUuid: string;
}

export default async (serverUuid: string, data: Data): Promise<ServerMount> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/servers/${serverUuid}/mounts`, {
        mount_uuid: data.mountUuid,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
