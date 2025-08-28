import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  action: ScheduleAction;
  order: number;
}

export default async (serverUuid: string, scheduleUuid: string, data: Data): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/steps`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.subuser))
      .catch(reject);
  });
};
