import { axiosInstance } from '@/api/axios.ts';

interface Data {
  partiallyDetached: boolean;
  force: boolean;
}

export default async (serverUuid: string, data: Data): Promise<number> => {
  const { data: response } = await axiosInstance.post(`/api/admin/servers/${serverUuid}/backups/delete-failed`, {
    partially_detached: data.partiallyDetached,
    force: data.force,
  });
  return response.queued;
};
