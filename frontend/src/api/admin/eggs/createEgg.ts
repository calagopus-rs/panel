import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';

interface Data {
  author: string;
  name: string;
  description: string | null;
  configFiles: {
    file: string;
    parser: ProcessConfigurationConfigParser;
    replace: {
      match: string;
      ifValue: string | null;
      replaceWith: string;
    }[];
  };
  configStartup: {
    done: string[];
    stripAnsi: boolean;
  };
  configStop: {
    type: string;
    value: string | null;
  };
  configScript: {
    container: string;
    entrypoint: string;
    content: string;
  };
  configAllocations: {
    userSelfAssign: {
      enabled: boolean;
      requirePrimaryAllocation: boolean;
      startPort: number;
      endPort: number;
    };
  };
  startup: string;
  forceOutgoingIp: boolean;
  features: string[];
  dockerImages: {
    [key: string]: string;
  }[];
  fileDenylist: string[];
}

export default async (nest: number, data: Data): Promise<AdminNestEgg> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nest}/eggs`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.nest))
      .catch(reject);
  });
};
