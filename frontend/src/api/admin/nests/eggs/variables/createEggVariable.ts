import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { z } from "zod";
import { adminEggVariableSchema } from "@/lib/schemas";

export default async (nestUuid: string, eggUuid: string, data: z.infer<typeof adminEggVariableSchema>): Promise<NestEggVariable> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`/api/admin/nests/${nestUuid}/eggs/${eggUuid}/variables`, transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data.variable))
      .catch(reject);
  });
};
