import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  name?: string;
  enabled?: boolean;
  triggers?: ScheduleTrigger[];
  condition?: ScheduleCondition;
}

export default async (serverUuid: string, scheduleUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
