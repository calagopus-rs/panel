import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  name: string;
  enabled: boolean;
  triggers: ScheduleTrigger[];
  condition: SchedulePreCondition;
}

export default async (uuid: string, data: Data): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.schedule))
      .catch(reject);
  });
};
