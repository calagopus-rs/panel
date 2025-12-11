import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  name?: string;
  enabled?: boolean;
  triggers?: ScheduleTrigger[];
  condition?: SchedulePreCondition;
}

export default async (serverUuid: string, scheduleUuid: string, data: Data): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
