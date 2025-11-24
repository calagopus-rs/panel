import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';

interface Data {
  action: ScheduleAction;
  order: number;
}

export default async (serverUuid: string, scheduleUuid: string, data: Data): Promise<ScheduleStep> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.scheduleStep))
      .catch(reject);
  });
};
