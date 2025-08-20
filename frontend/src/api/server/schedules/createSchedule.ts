import { axiosInstance } from '@/api/axios';

interface Data {
  name: string;
  enabled: boolean;
  triggers: ScheduleTrigger[];
  condition: ScheduleCondition;
}

export default async (uuid: string, data: Data): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules`, {
        name: data.name,
        enabled: data.enabled,
        triggers: data.triggers,
        condition: data.condition,
      })
      .then(({ data }) => resolve(data.subuser))
      .catch(reject);
  });
};
