import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider, Stack } from '@mantine/core';
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
import { backupDiskLabelMapping, databaseTypeLabelMapping } from '@/lib/enums';
import getBackupConfiguration from '@/api/admin/backupConfigurations/getBackupConfiguration';
import updateBackupConfiguration from '@/api/admin/backupConfigurations/updateBackupConfiguration';
import createBackupConfiguration from '@/api/admin/backupConfigurations/createBackupConfiguration';
import deleteBackupConfiguration from '@/api/admin/backupConfigurations/deleteBackupConfiguration';
import TextArea from '@/elements/input/TextArea';
import BackupS3 from '@/pages/admin/locations/forms/BackupS3';
import BackupRestic from '@/pages/admin/locations/forms/BackupRestic';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [backupConfiguration, setBackupConfiguration] = useState<UpdateBackupConfiguration>({
    name: '',
    description: null,
    backupDisk: 'local',
    backupConfigs: { s3: null, restic: null },
  } as UpdateBackupConfiguration);

  useEffect(() => {
    if (params.id) {
      getBackupConfiguration(params.id)
        .then((bc) => {
          setBackupConfiguration(bc);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateBackupConfiguration(params.id, backupConfiguration)
        .then(() => {
          addToast('Backup configuration updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createBackupConfiguration(backupConfiguration)
        .then((databaseHost) => {
          addToast('Backup configuration created.', 'success');
          navigate(`/admin/backup-configurations/${databaseHost.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = async () => {
    load(true, setLoading);
    await deleteBackupConfiguration(params.id)
      .then(() => {
        addToast('Backup configuration deleted.', 'success');
        navigate('/admin/backup-configurations');
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
        title={'Confirm Backup Configuration Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{backupConfiguration?.name}</Code>?
      </ConfirmationModal>

      <Title order={1}>{params.id ? 'Update' : 'Create'} Backup Configuration</Title>
      <Divider />

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={backupConfiguration.name || ''}
            onChange={(e) => setBackupConfiguration({ ...backupConfiguration, name: e.target.value })}
          />
          <Select
            withAsterisk
            label={'Backup Disk'}
            placeholder={'Backup Disk'}
            value={backupConfiguration.backupDisk || 'local'}
            onChange={(value) => setBackupConfiguration({ ...backupConfiguration, backupDisk: value as BackupDisk })}
            data={Object.entries(backupDiskLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={backupConfiguration.description || ''}
            rows={3}
            onChange={(e) => setBackupConfiguration({ ...backupConfiguration, description: e.target.value || null })}
          />
        </Group>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          {params.id && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>

        {backupConfiguration.backupDisk === 's3' || backupConfiguration.backupConfigs?.s3 ? (
          <BackupS3
            backupConfig={
              backupConfiguration.backupConfigs?.s3 ?? {
                accessKey: '',
                secretKey: '',
                bucket: '',
                region: '',
                endpoint: '',
                pathStyle: false,
                partSize: 512 * 1024 * 1024,
              }
            }
            setBackupConfigs={(config) =>
              setBackupConfiguration({
                ...backupConfiguration,
                backupConfigs: { ...backupConfiguration.backupConfigs, s3: config },
              })
            }
          />
        ) : null}

        {backupConfiguration.backupDisk === 'restic' || backupConfiguration.backupConfigs?.restic ? (
          <BackupRestic
            backupConfig={
              backupConfiguration.backupConfigs?.restic ?? {
                repository: '',
                retryLockSeconds: 60,
                environment: {},
              }
            }
            setBackupConfigs={(config) =>
              setBackupConfiguration({
                ...backupConfiguration,
                backupConfigs: { ...backupConfiguration.backupConfigs, restic: config },
              })
            }
          />
        ) : null}
      </Stack>
    </>
  );
};
