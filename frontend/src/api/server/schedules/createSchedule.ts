import { z } from 'zod';
import { axiosInstance } from '@/api/axios';
import { serverScheduleSchema } from '@/lib/schemas/server/schedule.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers';

export default async (uuid: string, data: z.infer<typeof serverScheduleSchema>): Promise<ServerSchedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.schedule))
      .catch(reject);
  });
};
