import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number): Promise<ResponseMeta<UserSshKey>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/ssh-keys?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.sshKeys),
          data: data.sshKeys.data || [],
        }),
      )
      .catch(reject);
  });
};
