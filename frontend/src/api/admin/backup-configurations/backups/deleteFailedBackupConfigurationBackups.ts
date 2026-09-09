import { axiosInstance } from '@/api/axios.ts';

interface Data {
  force: boolean;
}

export default async (backupConfigUuid: string, data: Data): Promise<number> => {
  const { data: response } = await axiosInstance.post(
    `/api/admin/backup-configurations/${backupConfigUuid}/backups/delete-failed`,
    data,
  );
  return response.queued;
};
