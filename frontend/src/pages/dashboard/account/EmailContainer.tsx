import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateEmail from '@/api/me/account/updateEmail';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { dashboardEmailSchema } from '@/lib/schemas/dashboard.ts';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function EmailContainer() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof dashboardEmailSchema>>({
    initialValues: {
      email: '',
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(dashboardEmailSchema),
  });

  useEffect(() => {
    form.setValues({
      email: user?.email,
    });
  }, [user]);

  const doUpdate = () => {
    setLoading(true);

    updateEmail(form.values)
      .then(() => {
        addToast('Email updated.', 'success');

        setUser({ ...user!, email: form.values.email });
        form.setFieldValue('password', '');
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
          Email
        </Title>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack className='mt-4'>
            <TextInput
              withAsterisk
              label='New Email'
              placeholder='New Email'
              autoComplete='email'
              {...form.getInputProps('email')}
            />
            <PasswordInput
              withAsterisk
              label='Current Password'
              placeholder='Current Password'
              autoComplete='current-password'
              {...form.getInputProps('password')}
            />
          </Stack>
          <Group className='mt-auto pt-4'>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Update Email
            </Button>
          </Group>
        </form>
      </Card>
    </Grid.Col>
  );
}
