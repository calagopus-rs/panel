import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import { dashboardPasswordSchema } from '@/lib/schemas/dashboard.ts';
import { useToast } from '@/providers/ToastProvider';

export default function PasswordContainer() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardPasswordSchema>>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardPasswordSchema),
  });

  const doUpdate = () => {
    setLoading(true);

    updatePassword({
      password: form.values.currentPassword,
      newPassword: form.values.newPassword,
    })
      .then(() => {
        addToast('Password updated.', 'success');
        form.reset();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c='white'>
          Password
        </Title>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack className='mt-4'>
            <PasswordInput
              withAsterisk
              label='Current Password'
              placeholder='Current Password'
              autoComplete='current-password'
              {...form.getInputProps('currentPassword')}
            />
            <PasswordInput
              withAsterisk
              label='New Password'
              placeholder='New Password'
              autoComplete='new-password'
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              withAsterisk
              label='Confirm New Password'
              placeholder='Confirm New Password'
              autoComplete='new-password'
              {...form.getInputProps('confirmNewPassword')}
            />
            <Group>
              <Button type='submit' disabled={!form.isValid()} loading={loading}>
                Update Password
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Grid.Col>
  );
}
