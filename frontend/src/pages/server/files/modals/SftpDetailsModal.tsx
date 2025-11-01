import Button from '@/elements/Button';
import CopyOnClick from '@/elements/CopyOnClick';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useAuth } from '@/providers/AuthProvider';
import { useServerStore } from '@/stores/server';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, ModalProps } from '@mantine/core';

export default ({ opened, onClose }: ModalProps) => {
  const { user } = useAuth();
  const { server } = useServerStore();

  return (
    <Modal title={'SFTP Details'} onClose={onClose} opened={opened}>
      <div className={'grid grid-cols-4 gap-2'}>
        <CopyOnClick content={'SFTP'} className={'text-left'}>
          <TextInput label={'Protocol'} value={'SFTP'} className={'pointer-events-none'} disabled />
        </CopyOnClick>
        <CopyOnClick content={server.sftpPort.toString()} className={'text-left'}>
          <TextInput label={'Port'} value={server.sftpPort} className={'pointer-events-none'} disabled />
        </CopyOnClick>
        <CopyOnClick content={server.sftpHost} className={'col-span-2 text-left'}>
          <TextInput label={'Host'} value={server.sftpHost} className={'pointer-events-none'} disabled />
        </CopyOnClick>

        <CopyOnClick content={`${user.username}.${server.uuidShort}`} className={'col-span-4 text-left'}>
          <TextInput
            label={'Username'}
            value={`${user.username}.${server.uuidShort}`}
            className={'pointer-events-none'}
            disabled
          />
        </CopyOnClick>

        <TextInput
          label={'Password'}
          value={'Your Control Panel Password'}
          className={'col-span-4 pointer-events-none'}
          disabled
        />
      </div>

      <Group mt={'md'}>
        <a href={`sftp://${user.username}.${server.uuidShort}@${server.sftpHost}:${server.sftpPort}`}>
          <Button onClick={onClose} leftSection={<FontAwesomeIcon icon={faExternalLink} />}>
            Launch
          </Button>
        </a>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
