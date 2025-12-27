import { axiosInstance } from '@/api/axios.ts';
import { transformKeysToSnakeCase } from '@/lib/transformers.ts';

interface Data {
  root: string;
  pathFilter: {
    include: string[];
    exclude: string[];
    caseInsensitive: boolean;
  } | null;
  sizeFilter: {
    min: number;
    max: number;
  } | null;
  contentFilter: {
    query: string;
    maxSearchSize: number;
    includeUnmatched: boolean;
    caseInsensitive: boolean;
  } | null;
}

export default async (uuid: string, data: Data): Promise<DirectoryEntry[]> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/client/servers/${uuid}/files/search`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.entries))
      .catch(reject);
  });
};
