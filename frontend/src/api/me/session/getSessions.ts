import { axiosInstance, getPaginationSet } from '@/api/axios';

export default async (page: number): Promise<ResponseMeta<UserSession>> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`/api/client/account/sessions?page=${page}`)
      .then(({ data }) =>
        resolve({
          ...getPaginationSet(data.sessions),
          data: data.sessions.data || [],
        }),
      )
      .catch(reject);
  });
};
