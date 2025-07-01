import { axiosInstance } from '@/api/axios';
import { rawDataToServerSchedule } from '@/api/transformers';

export default async (uuid: string): Promise<Schedule[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/servers/${uuid}/schedules`)
      .then(({ data }) => resolve((data.data || []).map((item: any) => rawDataToServerSchedule(item.attributes))))
      .catch(reject);
  });
};
