import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

export default async (serverUuid: string, scheduleUuid: string): Promise<object> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}/export`)
      .then(({ data }) => resolve(transformKeysToSnakeCase(data)))
      .catch(reject);
  });
};
