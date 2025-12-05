import { axiosInstance } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/lib/transformers';
import { z } from "zod";
import { authRegisterSchema } from "@/lib/schemas";

interface Data extends z.infer<typeof authRegisterSchema> {
  captcha?: string | null;
}

interface Response {
  user: User;
}

export default async (data: Data): Promise<Response> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/register', transformKeysToSnakeCase(data))
      .then(({ data }) => resolve(data))
      .catch(reject);
  });
};
