import { axiosInstance } from '@/api/axios.ts';

interface Data {
  force: boolean;
}

export default async (policyUuid: string, data: Data): Promise<number> => {
  const { data: response } = await axiosInstance.post(
    `/api/admin/system-backup-policies/${policyUuid}/backups/delete-failed`,
    data,
  );
  return response.queued;
};
