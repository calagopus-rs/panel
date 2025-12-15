import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import NumberInput from '@/elements/input/NumberInput.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminSettingsEmailSmtpSchema } from '@/lib/schemas/admin/settings.ts';

export default function EmailSmtp({ form }: { form: UseFormReturnType<z.infer<typeof adminSettingsEmailSmtpSchema>> }) {
  useEffect(() => {
    form.setValues({
      host: form.values.host ?? '',
      port: form.values.port ?? 587,
      useTls: form.values.useTls ?? true,
      fromAddress: form.values.fromAddress ?? '',
      fromName: form.values.fromName ?? null,
    });
  }, []);

  return (
    <Stack mt='md'>
      <Group grow>
        <TextInput withAsterisk label='Host' placeholder='Host' {...form.getInputProps('host')} />
        <NumberInput withAsterisk label='Port' placeholder='Port' min={0} {...form.getInputProps('port')} />
      </Group>

      <Switch
        label='Use TLS'
        checked={form.values.useTls}
        onChange={(e) => form.setFieldValue('useTls', e.target.checked)}
      />

      <Group grow>
        <TextInput label='Username' placeholder='Username' {...form.getInputProps('username')} />
        <PasswordInput label='Password' placeholder='Password' {...form.getInputProps('password')} />
      </Group>

      <Group grow>
        <TextInput
          withAsterisk
          label='From Address'
          placeholder='From Address'
          {...form.getInputProps('fromAddress')}
        />
        <TextInput label='From Name' placeholder='From Name' {...form.getInputProps('fromName')} />
      </Group>
    </Stack>
  );
}
