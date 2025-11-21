import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import updateStorageSettings from '@/api/admin/settings/updateStorageSettings';
import { httpErrorToHuman } from '@/api/axios';
import { transformKeysToSnakeCase } from '@/api/transformers';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import { storageDriverTypeLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import StorageFilesystem from './forms/StorageFilesystem';
import StorageS3 from './forms/StorageS3';

export default function StorageContainer() {
  const { addToast } = useToast();
  const { storageDriver } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdminSettings['storageDriver']>(storageDriver);

  const doUpdate = () => {
    setLoading(true);
    updateStorageSettings(transformKeysToSnakeCase({ ...settings } as StorageDriver))
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

      <Select
        label='Driver'
        value={settings.type}
        onChange={(value: StorageDriverType) => setSettings((settings) => ({ ...settings, type: value }))}
        data={Object.entries(storageDriverTypeLabelMapping).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      {settings.type === 'filesystem' ? (
        <StorageFilesystem settings={settings as StorageDriverFilesystem} setSettings={setSettings} />
      ) : settings.type === 's3' ? (
        <StorageS3 settings={settings as StorageDriverS3} setSettings={setSettings} />
      ) : null}

      <Group mt='md'>
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
}
