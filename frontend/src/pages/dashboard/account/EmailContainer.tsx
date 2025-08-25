import { httpErrorToHuman } from '@/api/axios';
import updateEmail from '@/api/me/account/updateEmail';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');

  const doUpdate = () => {
    updateEmail(email, password)
      .then(() => {
        addToast('Email updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Title order={2} c={'white'}>
        Email
      </Title>

      <Stack>
        <TextInput
          label={'New Email'}
          placeholder={'New Email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          label={'Current Password'}
          placeholder={'Current Password'}
          type={'password'}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Group>
          <Button disabled={!email || !password} onClick={doUpdate}>
            Update Email
          </Button>
        </Group>
      </Stack>
    </Grid.Col>
  );
};
