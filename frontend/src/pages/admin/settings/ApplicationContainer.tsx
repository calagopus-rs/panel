import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import getAdminTelemetry from '@/api/admin/getAdminTelemetry.ts';
import updateApplicationSettings from '@/api/admin/settings/updateApplicationSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { adminSettingsApplicationSchema } from '@/lib/schemas/admin/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import TelemetryPreviewModal from './modals/TelemetryPreviewModal.tsx';

export default function ApplicationContainer() {
  const { addToast } = useToast();
  const { app } = useAdminStore();
  const { languages } = useGlobalStore();

  const [loading, setLoading] = useState(false);
  const [telemetryData, setTelemetryData] = useState<object | null>(null);
  const [openModal, setOpenModal] = useState<'disableTelemetry' | 'enableRegistration' | null>(null);

  const form = useForm<z.infer<typeof adminSettingsApplicationSchema>>({
    initialValues: {
      name: '',
      url: '',
      language: 'en-US',
      twoFactorRequirement: 'none',
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

  const doPreviewTelemetry = () => {
    setLoading(true);

    getAdminTelemetry()
      .then((data) => {
        setTelemetryData(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <AdminContentContainer title='Application Settings' titleOrder={2}>
      <TelemetryPreviewModal
        telemetry={telemetryData}
        opened={telemetryData !== null}
        onClose={() => setTelemetryData(null)}
      />
      <ConfirmationModal
        opened={openModal === 'disableTelemetry'}
        onClose={() => setOpenModal(null)}
        title='Confirm Disabling Telemetry'
        confirm='Disable'
        onConfirmed={() => {
          form.setFieldValue('telemetryEnabled', false);
          setOpenModal(null);
        }}
      >
        Are you sure you want to disable telemetry? Telemetry helps us improve Calagopus by providing anonymous usage
        data. Disabling telemetry will prevent any data from being sent.
      </ConfirmationModal>
      <ConfirmationModal
        opened={openModal === 'enableRegistration'}
        onClose={() => setOpenModal(null)}
        title='Confirm Enabling Registration'
        confirm='Enable'
        onConfirmed={() => {
          form.setFieldValue('registrationEnabled', true);
          setOpenModal(null);
        }}
      >
        Are you sure you want to enable registration? Enabling registration allows anyone to create an account on this
        panel. If you do not have a captcha configured, this may be a mistake.
      </ConfirmationModal>

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

          <Group grow>
            <TextInput withAsterisk label='URL' placeholder='URL' {...form.getInputProps('url')} />

            <Select
              withAsterisk
              label='Two-Factor Authentication Requirement'
              data={[
                { label: 'Admins', value: 'admins' },
                { label: 'All Users', value: 'all_users' },
                { label: 'None', value: 'none' },
              ]}
              {...form.getInputProps('twoFactorRequirement')}
            />
          </Group>

          <Group grow>
            <Switch
              label='Enable Telemetry'
              description='Allow Calagopus to collect limited and anonymous usage data to help improve the application.'
              checked={form.values.telemetryEnabled}
              onChange={(e) => {
                if (!e.target.checked) {
                  setOpenModal('disableTelemetry');
                } else {
                  form.setFieldValue('telemetryEnabled', true);
                }
              }}
            />
            <Switch
              label='Enable Registration'
              name='registrationEnabled'
              checked={form.values.registrationEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  setOpenModal('enableRegistration');
                } else {
                  form.setFieldValue('registrationEnabled', false);
                }
              }}
            />
          </Group>
        </Stack>

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
          <Button variant='outline' loading={loading} onClick={doPreviewTelemetry}>
            Telemetry Preview
          </Button>
        </Group>
      </form>
    </AdminContentContainer>
  );
}
