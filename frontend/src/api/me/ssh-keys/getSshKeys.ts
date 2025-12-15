import { axiosInstance, getPaginationSet } from '@/api/axios.ts';

export default async (page: number, search?: string): Promise<ResponseMeta<UserSshKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get('/api/client/account/ssh-keys', {
        params: { page, search },
      })
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.sshKeys),
          data: data.sshKeys.data || [],
        }),
      )
      .catch(reject);
  });
};
