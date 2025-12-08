import {
  faAddressCard,
  faGlobe,
  faGlobeAmericas,
  faHardDrive,
  faMemory,
  faNetworkWired,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import getLocations from '@/api/admin/locations/getLocations';
import createNode from '@/api/admin/nodes/createNode';
import { httpErrorToHuman } from '@/api/axios';
import AlertError from '@/elements/alerts/AlertError';
import Button from '@/elements/Button';
import NumberInput from '@/elements/input/NumberInput';
import SizeInput from '@/elements/input/SizeInput';
import TextInput from '@/elements/input/TextInput';
import { OobeComponentProps } from '@/routers/OobeRouter';
import { oobeNodeSchema } from '@/lib/schemas/oobe';

export default function OobeNode({ onNext, skipFrom }: OobeComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [memoryInput, setMemoryInput] = useState('');
  const [diskInput, setDiskInput] = useState('');
  const [locationUuid, setLocationUuid] = useState('');

  const form = useForm<z.infer<typeof oobeNodeSchema>>({
    initialValues: {
      name: '',
      url: '',
      publicUrl: null,
      sftpHost: null,
      sftpPort: 2022,
      memory: 0,
      disk: 0,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(oobeNodeSchema),
  });

  useEffect(() => {
    setLoading(true);

    getLocations(1)
      .then((locations) => {
        if (locations.total > 0) {
          setLocationUuid(locations.data[0].uuid);
          setLoading(false);
        } else {
          setError('Something went wrong. No locations were found.');
        }
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      });
  }, []);

  const onSubmit = async () => {
    setLoading(true);

    createNode({
      name: form.values.name,
      public: true,
      description: null,
      publicUrl: form.values.publicUrl,
      url: form.values.url,
      sftpHost: form.values.sftpHost,
      sftpPort: form.values.sftpPort,
      maintenanceMessage: null,
      memory: form.values.memory,
      disk: form.values.disk,
      locationUuid: locationUuid,
      backupConfigurationUuid: null,
    })
      .then(() => {
        onNext();
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Stack gap='lg' py='md'>
      <Title order={2} mb='xs'>
        Node Configuration
      </Title>

      {error && <AlertError error={error} setError={setError} />}

      <Stack gap='md'>
        <Group grow>
          <TextInput
            withAsterisk
            label='Name'
            placeholder='My Server'
            leftSection={<FontAwesomeIcon icon={faAddressCard} size='sm' />}
            {...form.getInputProps('name')}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label='URL'
            description='used for internal communication with the node'
            leftSection={<FontAwesomeIcon icon={faGlobe} size='sm' />}
            placeholder='URL'
            {...form.getInputProps('url')}
          />
          <TextInput
            label='Public URL'
            description='used for websocket/downloads'
            leftSection={<FontAwesomeIcon icon={faGlobeAmericas} size='sm' />}
            placeholder='URL'
            {...form.getInputProps('publicUrl')}
          />
        </Group>

        <Group grow>
          <TextInput
            label='SFTP Host'
            placeholder='SFTP Host'
            leftSection={<FontAwesomeIcon icon={faNetworkWired} size='sm' />}
            {...form.getInputProps('sftpHost')}
          />
          <NumberInput
            withAsterisk
            label='SFTP Port'
            placeholder='SFTP Port'
            leftSection={<FontAwesomeIcon icon={faNetworkWired} size='sm' />}
            min={1}
            max={65535}
            {...form.getInputProps('sftpPort')}
          />
        </Group>

        <Group grow>
          <SizeInput
            withAsterisk
            label='Memory + Unit (e.g. 1 GiB)'
            placeholder='1 GiB'
            leftSection={<FontAwesomeIcon icon={faMemory} size='sm' />}
            {...form.getInputProps('memory')}
            value={memoryInput}
            setState={setMemoryInput}
            onChange={(value) => form.setFieldValue('memory', value)}
          />
          <SizeInput
            withAsterisk
            label='Disk + Unit (e.g. 50 GiB)'
            placeholder='50 GiB'
            leftSection={<FontAwesomeIcon icon={faHardDrive} size='sm' />}
            {...form.getInputProps('disk')}
            value={diskInput}
            setState={setDiskInput}
            onChange={(value) => form.setFieldValue('disk', value)}
          />
        </Group>

        <Group justify='flex-end' mt='xl'>
          {!!skipFrom && (
            <Button variant='outline' onClick={() => skipFrom('node')}>
              Skip
            </Button>
          )}
          <Button disabled={!form.isValid()} loading={loading} onClick={onSubmit}>
            Create & Continue
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
}
