import { axiosInstance } from '@/api/axios.ts';

interface Data {
  ip: string;
  ipAlias: string | null;
  ports: number[];
}

export default async (nodeUuid: string, data: Data): Promise<{ created: number }> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nodes/${nodeUuid}/allocations`, {
        ip: data.ip,
        ip_alias: data.ipAlias,
        ports: data.ports,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
