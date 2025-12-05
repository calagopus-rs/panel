import { axiosInstance } from '@/api/axios';
import { authResetPasswordSchema } from "@/lib/schemas";
import { z } from "zod";

export default async (token: string, data: z.infer<typeof authResetPasswordSchema>): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/reset', { token, new_password: data.password })
      .then(() => resolve())
      .catch(reject);
  });
};
