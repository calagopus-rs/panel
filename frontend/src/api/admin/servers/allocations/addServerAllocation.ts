import { axiosInstance } from '@/api/axios';

interface Data {
  allocationUuid: string;
}

export default async (serverUuid: string, data: Data): Promise<ServerAllocation> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/servers/${serverUuid}/allocations`, {
        allocation_uuid: data.allocationUuid,
      })
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
