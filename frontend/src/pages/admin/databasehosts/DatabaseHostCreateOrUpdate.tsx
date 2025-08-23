import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios';
import getDatabaseHost from '@/api/admin/databaseHosts/getDatabaseHost';
import updateDatabaseHost from '@/api/admin/databaseHosts/updateDatabaseHost';
import createDatabaseHost from '@/api/admin/databaseHosts/createDatabaseHost';
import deleteDatabaseHost from '@/api/admin/databaseHosts/deleteDatabaseHost';
import testDatabaseHost from '@/api/admin/databaseHosts/testDatabaseHost';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import Select from '@/elements/input/Select';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [databaseHost, setDatabaseHost] = useState<AdminUpdateDatabaseHost>({
    name: '',
    username: '',
    password: null,
    host: '',
    port: 3306,
    public: false,
    publicHost: null,
    publicPort: null,
    type: 'mysql',
  } as AdminUpdateDatabaseHost);

  useEffect(() => {
    if (params.id) {
      getDatabaseHost(params.id)
        .then((user) => {
          setDatabaseHost(user);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateDatabaseHost(params.id, databaseHost)
        .then(() => {
          addToast('Database host updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createDatabaseHost(databaseHost)
        .then((databaseHost) => {
          addToast('Database host created.', 'success');
          navigate(`/admin/database-hosts/${databaseHost.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doTest = () => {
    load(true, setLoading);
    testDatabaseHost(params.id)
      .then(() => {
        addToast('Test successfully completed', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  const doDelete = () => {
    load(true, setLoading);
    deleteDatabaseHost(params.id)
      .then(() => {
        addToast('Database host deleted.', 'success');
        navigate('/admin/database-hosts');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Database Host Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{databaseHost?.name}</Code>?
      </ConfirmationModal>

      <Title order={1}>{params.id ? 'Update' : 'Create'} Database Host</Title>
      <Divider my={'sm'} />

      <Group grow>
        <TextInput
          label={'Name'}
          placeholder={'Name'}
          value={databaseHost.name || ''}
          onChange={(e) => setDatabaseHost({ ...databaseHost, name: e.target.value })}
          mt={'sm'}
        />
        <Select
          label={'Type'}
          data={[
            { value: 'mysql', label: 'MySQL' },
            { value: 'postgres', label: 'PostgreSQL' },
          ]}
          value={databaseHost.type || 'mysql'}
          onChange={(value) => setDatabaseHost({ ...databaseHost, type: value as DatabaseType })}
          mt={'sm'}
          disabled={params.id ? true : false}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Username'}
          placeholder={'Username'}
          value={databaseHost.username || ''}
          onChange={(e) => setDatabaseHost({ ...databaseHost, username: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Password'}
          placeholder={'Password'}
          type={'password'}
          value={databaseHost.password || ''}
          onChange={(e) => setDatabaseHost({ ...databaseHost, password: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Host'}
          placeholder={'Host'}
          value={databaseHost.host || ''}
          onChange={(e) => setDatabaseHost({ ...databaseHost, host: e.target.value })}
          mt={'sm'}
        />
        <NumberInput
          label={'Port'}
          placeholder={'Port'}
          min={0}
          value={databaseHost.port || 3306}
          onChange={(value) => setDatabaseHost({ ...databaseHost, port: Number(value) || 0 })}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Public Host'}
          placeholder={'Public Host'}
          value={databaseHost.publicHost || ''}
          onChange={(e) => setDatabaseHost({ ...databaseHost, publicHost: e.target.value })}
          mt={'sm'}
        />
        <NumberInput
          label={'Public Port'}
          placeholder={'Public Port'}
          min={0}
          value={databaseHost.publicPort || undefined}
          onChange={(value) => setDatabaseHost({ ...databaseHost, publicPort: Number(value) || null })}
          mt={'sm'}
        />
      </Group>

      <Switch
        label={'Public'}
        checked={databaseHost.public || false}
        onChange={(e) => setDatabaseHost({ ...databaseHost, public: e.currentTarget.checked })}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <Button onClick={doCreateOrUpdate} loading={loading}>
          Save
        </Button>
        {params.id && (
          <Button variant={'outline'} onClick={doTest} loading={loading}>
            Test
          </Button>
        )}
        {params.id && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
