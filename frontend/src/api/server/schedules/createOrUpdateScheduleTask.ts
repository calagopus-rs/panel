import { axiosInstance } from '@/api/axios';
import { rawDataToServerSchedule } from '@/api/transformers';

interface Data {
  action: string;
  payload: string;
  timeOffset: string | number;
  continueOnFailure: boolean;
}

export default async (uuid: string, schedule: number, task: number | undefined, data: Data): Promise<Schedule> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/schedules/${schedule}/tasks${task ? `/${task}` : ''}`, {
        action: data.action,
        payload: data.payload,
        continue_on_failure: data.continueOnFailure,
        time_offset: data.timeOffset,
      })
      .then(({ data }) => resolve(rawDataToServerSchedule(data.attributes)))
      .catch(reject);
  });
};
