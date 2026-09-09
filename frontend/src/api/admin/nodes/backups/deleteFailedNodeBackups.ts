import { axiosInstance } from '@/api/axios.ts';

interface Data {
  detached: boolean;
  force: boolean;
}

export default async (nodeUuid: string, data: Data): Promise<number> => {
  const { data: response } = await axiosInstance.post(`/api/admin/nodes/${nodeUuid}/backups/delete-failed`, data);
  return response.queued;
};
