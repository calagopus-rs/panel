import { Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import TextInput from '@/elements/input/TextInput';
import { adminSettingsStorageFilesystemSchema } from '@/lib/schemas';

export default function StorageFilesystem({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminSettingsStorageFilesystemSchema>>;
}) {
  useEffect(() => {
    form.setValues({
      path: form.values.path ?? '',
    });
  }, []);

  return (
    <Stack mt='md'>
      <TextInput withAsterisk label='Path' placeholder='Path' {...form.getInputProps('path')} />
    </Stack>
  );
}
