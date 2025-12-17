import { Group } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateCaptchaSettings from '@/api/admin/settings/updateCaptchaSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Select from '@/elements/input/Select.tsx';
import { captchaProviderTypeLabelMapping } from '@/lib/enums.ts';
import {
  adminSettingsCaptchaProviderRecaptchaSchema,
  adminSettingsCaptchaProviderSchema,
  adminSettingsCaptchaProviderTurnstileSchema,
} from '@/lib/schemas/admin/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import CaptchaRecaptcha from './forms/CaptchaRecaptcha.tsx';
import CaptchaTurnstile from './forms/CaptchaTurnstile.tsx';

export default function CaptchaContainer() {
  const { addToast } = useToast();
  const { captchaProvider } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsCaptchaProviderSchema>>({
    initialValues: {
      type: 'none',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsCaptchaProviderSchema),
  });

  useEffect(() => {
    form.setValues({
      ...captchaProvider,
    });
  }, [captchaProvider]);

  const doUpdate = () => {
    setLoading(true);

    updateCaptchaSettings(form.values)
      .then(() => {
        addToast('Captcha settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <AdminContentContainer title='Captcha Settings' titleOrder={2}>
      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Select
          label='Provider'
          data={Object.entries(captchaProviderTypeLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          {...form.getInputProps('type')}
        />

        {form.values.type === 'turnstile' ? (
          <CaptchaTurnstile
            form={form as UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderTurnstileSchema>>}
          />
        ) : form.values.type === 'recaptcha' ? (
          <CaptchaRecaptcha
            form={form as UseFormReturnType<z.infer<typeof adminSettingsCaptchaProviderRecaptchaSchema>>}
          />
        ) : null}

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </AdminContentContainer>
  );
}
