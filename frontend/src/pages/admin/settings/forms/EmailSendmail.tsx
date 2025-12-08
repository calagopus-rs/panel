import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import TextInput from '@/elements/input/TextInput';
import { adminSettingsEmailSendmailSchema } from '@/lib/schemas/admin/settings';

export default function EmailSendmail({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminSettingsEmailSendmailSchema>>;
}) {
  useEffect(() => {
    form.setValues({
      command: form.values.command ?? 'sendmail',
      fromAddress: form.values.fromAddress ?? '',
      fromName: form.values.fromName ?? null,
    });
  }, []);

  return (
    <Stack mt='md'>
      <TextInput label='Command' placeholder='Command' {...form.getInputProps('command')} />

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
