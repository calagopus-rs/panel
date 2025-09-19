import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import { Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import updateNode from '@/api/admin/nodes/updateNode';
import createNode from '@/api/admin/nodes/createNode';
import deleteNode from '@/api/admin/nodes/deleteNode';
import getLocations from '@/api/admin/locations/getLocations';
import debounce from 'debounce';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import resetNodeToken from '@/api/admin/nodes/resetNodeToken';
import Tooltip from '@/elements/Tooltip';

export default ({ contextNode }: { contextNode?: Node }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [search, setSearch] = useState('');
  const [doRefetch, setDoRefetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [node, setNode] = useState<UpdateNode>({
    locationUuid: '',
    name: '',
    public: false,
    description: null,
    publicUrl: null,
    url: '',
    sftpHost: null,
    sftpPort: 2022,
    maintenanceMessage: null,
    memory: 8192,
    disk: 10240,
  } as UpdateNode);

  useEffect(() => {
    setNode({
      locationUuid: contextNode?.location.uuid ?? '',
      name: contextNode?.name ?? '',
      public: contextNode?.public ?? false,
      description: contextNode?.description ?? null,
      publicUrl: contextNode?.publicUrl ?? null,
      url: contextNode?.url ?? '',
      sftpHost: contextNode?.sftpHost ?? null,
      sftpPort: contextNode?.sftpPort ?? 2022,
      maintenanceMessage: contextNode?.maintenanceMessage ?? null,
      memory: contextNode?.memory ?? 8192,
      disk: contextNode?.disk ?? 10240,
    });
  }, [contextNode]);

  const fetchLocations = (search: string) => {
    getLocations(1, search)
      .then((response) => {
        setLocations(response.data);

        if (response.total > response.data.length) {
          setDoRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedSearch = useCallback(
    debounce((search: string) => {
      fetchLocations(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doRefetch) {
      setDebouncedSearch(search);
    }
  }, [search]);

  useEffect(() => {
    fetchLocations('');
  }, []);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateNode(params.id, node)
        .then(() => {
          addToast('Node updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createNode(node)
        .then((node) => {
          addToast('Node created.', 'success');
          navigate(`/admin/nodes/${node.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doResetToken = () => {
    load(true, setLoading);
    resetNodeToken(params.id)
      .then(({ tokenId, token }) => {
        addToast('Node token reset.', 'success');
        contextNode.tokenId = tokenId;
        contextNode.token = token;
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  const doDelete = async () => {
    load(true, setLoading);
    await deleteNode(params.id)
      .then(() => {
        addToast('Node deleted.', 'success');
        navigate('/admin/nodes');
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
        title={'Confirm Node Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{node?.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{params.id ? 'Update' : 'Create'} Node</Title>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={node.name || ''}
            onChange={(e) => setNode({ ...node, name: e.target.value })}
          />
          <Select
            withAsterisk
            label={'Location'}
            placeholder={'Location'}
            value={node.locationUuid}
            onChange={(value) => setNode({ ...node, locationUuid: value })}
            data={locations.map((location) => ({
              label: location.name,
              value: location.uuid,
            }))}
            searchable
            searchValue={search}
            onSearchChange={setSearch}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'URL'}
            description={'used for internal communication with the panel'}
            placeholder={'URL'}
            value={node.url || ''}
            onChange={(e) => setNode({ ...node, url: e.target.value })}
          />
          <TextInput
            label={'Public URL'}
            description={'used for websocket/downloads'}
            placeholder={'URL'}
            value={node.publicUrl || ''}
            onChange={(e) => setNode({ ...node, publicUrl: e.target.value || null })}
          />
        </Group>

        <Group grow>
          <TextInput
            label={'SFTP Host'}
            placeholder={'SFTP Host'}
            value={node.sftpHost || ''}
            onChange={(e) => setNode({ ...node, sftpHost: e.target.value || null })}
          />
          <NumberInput
            withAsterisk
            label={'SFTP Port'}
            placeholder={'SFTP Port'}
            value={node.sftpPort}
            min={1}
            max={65535}
            onChange={(value) => setNode({ ...node, sftpPort: value ? Number(value) : null })}
          />
        </Group>

        <Group grow>
          <NumberInput
            withAsterisk
            label={'Memory MB'}
            placeholder={'Memory MB'}
            value={node.memory}
            min={1024}
            onChange={(value) => setNode({ ...node, memory: Number(value) })}
          />
          <NumberInput
            withAsterisk
            label={'Disk MB'}
            placeholder={'Disk MB'}
            value={node.disk}
            min={1024}
            onChange={(value) => setNode({ ...node, disk: Number(value) })}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={node.description || ''}
            rows={3}
            onChange={(e) => setNode({ ...node, description: e.target.value || null })}
          />
          <TextInput
            label={'Maintenance Message'}
            placeholder={'Maintenance Message'}
            value={node.maintenanceMessage || ''}
            onChange={(e) => setNode({ ...node, maintenanceMessage: e.target.value || null })}
          />
        </Group>

        <Switch
          label={'Public'}
          checked={node.public || false}
          onChange={(e) => setNode({ ...node, public: e.currentTarget.checked })}
        />

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          {params.id && (
            <Button color={'red'} variant={'outline'} onClick={doResetToken} loading={loading}>
              Reset Token
            </Button>
          )}
          {params.id &&
            (contextNode.servers > 0 ? (
              <Tooltip label={'Cannot delete node with servers'}>
                <Button color={'red'} loading={loading} disabled>
                  Delete
                </Button>
              </Tooltip>
            ) : (
              <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
                Delete
              </Button>
            ))}
        </Group>
      </Stack>
    </>
  );
};
