import { faExternalLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, ModalProps } from '@mantine/core';
import Button from '@/elements/Button.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function SftpDetailsModal({ opened, onClose }: ModalProps) {
  const { user } = useAuth();
  const { server } = useServerStore();

  return (
    <Modal title='SFTP Details' onClose={onClose} opened={opened}>
      <div className='grid grid-cols-4 gap-2'>
        <CopyOnClick content='SFTP' className='text-left'>
          <TextInput label='Protocol' value='SFTP' className='pointer-events-none' readOnly />
        </CopyOnClick>
        <CopyOnClick content={server.sftpPort.toString()} className='text-left'>
          <TextInput label='Port' value={server.sftpPort} className='pointer-events-none' readOnly />
        </CopyOnClick>
        <CopyOnClick content={server.sftpHost} className='col-span-2 text-left'>
          <TextInput label='Host' value={server.sftpHost} className='pointer-events-none' readOnly />
        </CopyOnClick>

        <CopyOnClick content={`${user!.username}.${server.uuidShort}`} className='col-span-4 text-left'>
          <TextInput
            label='Username'
            value={`${user!.username}.${server.uuidShort}`}
            className='pointer-events-none'
            readOnly
          />
        </CopyOnClick>

        <TextInput
          label='Password'
          value='Your Control Panel Password'
          className='col-span-4 pointer-events-none'
          classNames={{ input: 'text-white/80!' }}
          readOnly
        />
      </div>

      <Group mt='md'>
        <a href={`sftp://${user!.username}.${server.uuidShort}@${server.sftpHost}:${server.sftpPort}`}>
          <Button onClick={onClose} leftSection={<FontAwesomeIcon icon={faExternalLink} />}>
            Launch
          </Button>
        </a>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
