import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminSettingsEmailFilesystemSchema } from '@/lib/schemas/admin/settings.ts';

export default function EmailFile({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminSettingsEmailFilesystemSchema>>;
}) {
  useEffect(() => {
    form.setValues({
      path: form.values.path ?? '',
      fromAddress: form.values.fromAddress ?? '',
      fromName: form.values.fromName ?? null,
    });
  }, []);

  return (
    <Stack mt='md'>
      <TextInput withAsterisk label='Path' placeholder='Path' {...form.getInputProps('path')} />

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
