import { Grid, Group, Stack, Title } from '@mantine/core';
import { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { httpErrorToHuman } from '@/api/axios';
import removeAvatar from '@/api/me/account/removeAvatar';
import updateAvatar from '@/api/me/account/updateAvatar';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import FileInput from '@/elements/input/FileInput';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

export default function AvatarContainer() {
  const { addToast } = useToast();
  const { user, setUser } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const editor = useRef<AvatarEditor>(null);

  const doUpdate = () => {
    setLoading(true);

    try {
      editor.current?.getImageScaledToCanvas().toBlob((blob) => {
        updateAvatar(blob)
          .then((avatar) => {
            addToast('Avatar updated.', 'success');

            setUser({ ...user!, avatar });
          })
          .catch((msg) => {
            addToast(httpErrorToHuman(msg), 'error');
          })
          .finally(() => setLoading(false));
      });
    } catch (err) {
      load(false, setLoading);
      console.error(err);
    }
  };

  const doRemove = () => {
    removeAvatar()
      .then(() => {
        addToast('Avatar removed.', 'success');

        setUser({ ...user!, avatar: null });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c={'white'}>
          Avatar
        </Title>
        <Group className={'mt-4'}>
          <AvatarEditor
            ref={editor}
            image={file ?? user.avatar}
            height={512}
            width={512}
            showGrid
            style={{ width: 256, height: 256, borderRadius: '0.25rem' }}
          />

          <Stack className={'h-full grow'}>
            <FileInput
              label={'Avatar'}
              placeholder={'Avatar'}
              value={file}
              onChange={(file) => setFile(file)}
              accept={'image/*'}
              clearable
            />

            <Group>
              <Button loading={loading} disabled={!file} onClick={doUpdate}>
                Update Avatar
              </Button>
              <Button color={'red'} loading={loading} disabled={!user.avatar} onClick={doRemove}>
                Remove Avatar
              </Button>
            </Group>
          </Stack>
        </Group>
      </Card>
    </Grid.Col>
  );
}
