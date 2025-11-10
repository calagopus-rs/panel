import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updatePassword from '@/api/me/account/updatePassword';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';

export default function PasswordContainer() {
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

    updatePassword(currentPassword, newPassword)
      .then(() => {
        addToast('Password updated.', 'success');

        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c={'white'}>
          Password
        </Title>
        <Stack className={'mt-4'}>
          <TextInput
            withAsterisk
            label={'Current Password'}
            placeholder={'Current Password'}
            type={'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordInput
            withAsterisk
            label={'New Password'}
            placeholder={'New Password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextInput
            withAsterisk
            label={'Confirm New Password'}
            placeholder={'Confirm New Password'}
            type={'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          <Group>
            <Button
              loading={loading}
              disabled={!currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
              onClick={doUpdate}
            >
              Update Password
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
}
