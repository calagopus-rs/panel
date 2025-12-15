import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminSettingsCaptchaProviderTurnstileSchema } from '@/lib/schemas/admin/settings.ts';

export default function CaptchaTurnstile({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderTurnstileSchema>>;
}) {
  useEffect(() => {
    form.setValues({
      siteKey: form.values.siteKey ?? '',
      secretKey: form.values.secretKey ?? '',
    });
  }, []);

  return (
    <Stack mt='md'>
      <Group grow>
        <TextInput withAsterisk label='Site Key' placeholder='Site Key' {...form.getInputProps('siteKey')} />
        <PasswordInput withAsterisk label='Secret Key' placeholder='Secret Key' {...form.getInputProps('secretKey')} />
      </Group>
    </Stack>
  );
}
