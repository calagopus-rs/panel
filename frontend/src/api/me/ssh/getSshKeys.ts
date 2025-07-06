import { axiosInstance, getPaginationSet } from '@/api/axios';
import { transformKeysToCamelCase } from '@/api/transformers';

export default async (page: number): Promise<PaginatedResult<UserSshKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/ssh-keys?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.ssh_keys),
          data: (data.ssh_keys.data || []).map((datum: any) => transformKeysToCamelCase(datum)),
        }),
      )
      .catch(reject);
  });
};
