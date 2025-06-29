import { ServerStats } from '@/api/types';
import { axiosInstance, FractalResponseData } from '@/api/axios';
import { rawDataToServerStats } from '@/api/transformers';

export default async (uuid: string): Promise<ServerStats> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get<FractalResponseData>(`/api/client/servers/${uuid}/resources`)
      .then(({ data }) => resolve(rawDataToServerStats(data)))
      .catch(reject);
  });
};
