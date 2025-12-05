import { axiosInstance } from '@/api/axios';
import { authForgotPasswordSchema } from "@/lib/schemas";
import { z } from "zod";

export default async (data: z.infer<typeof authForgotPasswordSchema>, captcha: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post('/api/auth/password/forgot', { ...data, captcha })
      .then(() => resolve())
      .catch(reject);
  });
};
