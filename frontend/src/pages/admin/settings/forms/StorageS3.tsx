import { Group, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { z } from 'zod';
import PasswordInput from '@/elements/input/PasswordInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { adminSettingsStorageS3Schema } from '@/lib/schemas/admin/settings';

export default function StorageS3({ form }: { form: UseFormReturnType<z.infer<typeof adminSettingsStorageS3Schema>> }) {
  useEffect(() => {
    form.setValues({
      accessKey: form.values.accessKey ?? '',
      secretKey: form.values.secretKey ?? '',
      bucket: form.values.bucket ?? '',
      region: form.values.region ?? '',
      endpoint: form.values.endpoint ?? '',
      pathStyle: form.values.pathStyle ?? false,
    });
  }, []);

  return (
    <Stack mt='md'>
      <Group grow>
        <TextInput withAsterisk label='Access Key' placeholder='Access Key' {...form.getInputProps('accessKey')} />
        <PasswordInput withAsterisk label='Secret Key' placeholder='Secret Key' {...form.getInputProps('secretKey')} />
      </Group>

      <Group grow>
        <TextInput withAsterisk label='Bucket' placeholder='Bucket' {...form.getInputProps('bucket')} />
        <TextInput withAsterisk label='Region' placeholder='Region' {...form.getInputProps('region')} />
      </Group>

      <TextInput withAsterisk label='Endpoint' placeholder='Endpoint' {...form.getInputProps('endpoint')} />

      <Switch
        label={form.values.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
        checked={form.values.pathStyle}
        onChange={(e) => form.setFieldValue('pathStyle', e.target.checked)}
      />
    </Stack>
  );
}
