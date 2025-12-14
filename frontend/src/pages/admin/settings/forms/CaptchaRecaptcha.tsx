import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminSettingsCaptchaProviderRecaptchaSchema } from '@/lib/schemas/admin/settings.ts';

export default function CaptchaRecaptcha({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderRecaptchaSchema>>;
}) {
  useEffect(() => {
    form.setValues({
      siteKey: form.values.siteKey ?? '',
      secretKey: form.values.secretKey ?? '',
      v3: form.values.v3 ?? false,
    });
  }, []);

  return (
    <Stack mt='md'>
      <Group grow>
        <TextInput withAsterisk label='Site Key' placeholder='Site Key' {...form.getInputProps('siteKey')} />
        <PasswordInput withAsterisk label='Secret Key' placeholder='Secret Key' {...form.getInputProps('secretKey')} />
      </Group>

      <Switch label='V3' checked={form.values.v3} onChange={(e) => form.setFieldValue('v3', e.target.checked)} />
    </Stack>
  );
}
