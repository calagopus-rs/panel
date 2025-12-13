import { Group, Title } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateStorageSettings from '@/api/admin/settings/updateStorageSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import { storageDriverTypeLabelMapping } from '@/lib/enums';
import {
  adminSettingsStorageFilesystemSchema,
  adminSettingsStorageS3Schema,
  adminSettingsStorageSchema,
} from '@/lib/schemas/admin/settings';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import StorageFilesystem from './forms/StorageFilesystem';
import StorageS3 from './forms/StorageS3';

export default function StorageContainer() {
  const { addToast } = useToast();
  const { storageDriver } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsStorageSchema>>({
    initialValues: {
      type: 'filesystem',
      path: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsStorageSchema),
  });

  useEffect(() => {
    form.setValues({
      ...storageDriver,
    });
  }, [storageDriver]);

  const doUpdate = () => {
    setLoading(true);
    updateStorageSettings(form.values)
      .then(() => {
        addToast('Storage settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Storage Settings
      </Title>

      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Select
          label='Driver'
          data={Object.entries(storageDriverTypeLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          {...form.getInputProps('type')}
        />

        {form.values.type === 'filesystem' ? (
          <StorageFilesystem form={form as UseFormReturnType<z.infer<typeof adminSettingsStorageFilesystemSchema>>} />
        ) : form.values.type === 's3' ? (
          <StorageS3 form={form as UseFormReturnType<z.infer<typeof adminSettingsStorageS3Schema>>} />
        ) : null}

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </>
  );
}
