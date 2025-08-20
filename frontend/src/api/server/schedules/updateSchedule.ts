import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  enabled: boolean;
  triggers: ScheduleTrigger[];
  condition: ScheduleCondition;
}

export default async (uuid: string, schedule: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${uuid}/schedules/${schedule}`, {
        name: data.name,
        enabled: data.enabled,
        triggers: data.triggers,
        condition: data.condition,
      })
      .then(() => resolve())
      .catch(reject);
  });
};
