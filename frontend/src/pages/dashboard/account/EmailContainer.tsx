import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateEmail from '@/api/me/account/updateEmail';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function EmailContainer() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    setLoading(true);

    updateEmail(email, password)
      .then(() => {
        addToast('Email updated.', 'success');

        setUser({ ...user!, email });
        setPassword('');
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
        <Stack className='mt-4'>
          <TextInput
            withAsterisk
            label='New Email'
            placeholder='New Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextInput
            withAsterisk
            label='Current Password'
            placeholder='Current Password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Stack>
        <Group className='mt-auto pt-4'>
          <Button loading={loading} disabled={!email || !password} onClick={doUpdate}>
            Update Email
          </Button>
        </Group>
      </Card>
    </Grid.Col>
  );
}
