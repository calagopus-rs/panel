import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod/v4';
import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import { useToast } from '@/providers/ToastProvider';

const schema = z
  .object({
    currentPassword: z.string().max(512),
    newPassword: z.string().min(8).max(512),
    confirmNewPassword: z.string().min(8).max(512),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export default function PasswordContainer() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
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
        <Stack className='mt-4'>
          <PasswordInput
            withAsterisk
            label='Current Password'
            placeholder='Current Password'
            {...form.getInputProps('currentPassword')}
          />
          <PasswordInput
            withAsterisk
            label='New Password'
            placeholder='New Password'
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            withAsterisk
            label='Confirm New Password'
            placeholder='Confirm New Password'
            {...form.getInputProps('confirmNewPassword')}
          />
          <Group>
            <Button loading={loading} disabled={!form.isValid()} onClick={doUpdate}>
              Update Password
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
}
