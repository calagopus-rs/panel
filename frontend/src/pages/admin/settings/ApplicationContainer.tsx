import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { adminSettingsApplicationSchema } from '@/lib/schemas/admin/settings';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useGlobalStore } from '@/stores/global';

export default function ApplicationContainer() {
  const { addToast } = useToast();
  const { app } = useAdminStore();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsApplicationSchema>>({
    initialValues: {
      name: '',
      url: '',
      language: 'en-US',
      telemetryEnabled: true,
      registrationEnabled: true,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsApplicationSchema),
  });

  useEffect(() => {
    form.setValues({
      ...app,
    });
  }, [app]);

  const doUpdate = () => {
    setLoading(true);
    updateApplicationSettings(form.values)
      .then(() => {
        addToast('Application settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Title mt='md' order={2}>
        Application Settings
      </Title>

      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <Group grow>
            <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
            <Select
              withAsterisk
              label='Language'
              placeholder='Language'
              data={languages.map((language) => ({
                label: new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language,
                value: language,
              }))}
              searchable
              {...form.getInputProps('language')}
            />
          </Group>

          <TextInput withAsterisk label='URL' placeholder='URL' {...form.getInputProps('url')} />

          <Group grow>
            <Switch
              label='Enable Telemetry'
              description='Allow Calagopus to collect limited and anonymous usage data to help improve the application.'
              checked={form.values.telemetryEnabled}
              onChange={(e) => form.setFieldValue('telemetryEnabled', e.target.checked)}
            />
            <Switch
              label='Enable Registration'
              name='registrationEnabled'
              checked={form.values.registrationEnabled}
              onChange={(e) => form.setFieldValue('registrationEnabled', e.target.checked)}
            />
          </Group>
        </Stack>

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </>
  );
}
