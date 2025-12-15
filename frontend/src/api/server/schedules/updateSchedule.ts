import { z } from 'zod';
import { axiosInstance } from '@/api/axios.ts';
import { serverScheduleUpdateSchema } from '@/lib/schemas/server/schedule.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

export default async (
  serverUuid: string,
  scheduleUuid: string,
  data: z.infer<typeof serverScheduleUpdateSchema>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .patch(`/api/client/servers/${serverUuid}/schedules/${scheduleUuid}`, transformKeysToSnakeCase(data))
      .then(() => resolve())
      .catch(reject);
  });
};
