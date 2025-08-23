import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { Group, ModalProps } from '@mantine/core';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default ({ database, opened, onClose }: Props) => {
  const host = `${database.host}:${database.port}`;

  const jdbcConnectionString = `jdbc:mysql://${database.username}${
    database.password ? `:${encodeURIComponent(database.password)}` : ''
  }@${host}/${database.name}`;

  return (
    <Modal title={'Database connection details'} onClose={onClose} opened={opened}>
      <TextInput label={'Database Name'} placeholder={'Database Name'} value={database.name} disabled />

      <TextInput label={'Host'} placeholder={'Host'} value={host} disabled mt={'sm'} />

      <TextInput label={'Username'} placeholder={'Username'} value={database.username} disabled mt={'sm'} />

      <TextInput label={'Password'} placeholder={'Password'} value={database.password} disabled mt={'sm'} />

      <TextInput
        label={'JDBC Connection String'}
        placeholder={'JDBC Connection String'}
        value={jdbcConnectionString}
        disabled
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
