import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import getDatabaseHosts from '@/api/admin/database-hosts/getDatabaseHosts';
import createLocationDatabaseHost from '@/api/admin/locations/database-hosts/createLocationDatabaseHost';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { databaseTypeLabelMapping } from '@/lib/enums';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function LocationDatabaseHostCreateModal({
  location,
  opened,
  onClose,
}: ModalProps & { location: Location }) {
  const { addToast } = useToast();
  const { addLocationDatabaseHost } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [databaseHost, setDatabaseHost] = useState<DatabaseHost | null>(null);

  const databaseHosts = useSearchableResource<DatabaseHost>({
    fetcher: (search) => getDatabaseHosts(1, search),
  });

  const doCreate = () => {
    setLoading(true);

    createLocationDatabaseHost(location.uuid, databaseHost.uuid)
      .then(() => {
        addToast('Location Database Host created.', 'success');

        onClose();
        addLocationDatabaseHost({ databaseHost, created: new Date().toString() });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Create Location Database Host'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'Database Host'}
          placeholder={'Database Host'}
          value={databaseHost?.uuid}
          onChange={(value) => setDatabaseHost(databaseHosts.items.find((dh) => dh.uuid === value))}
          data={Object.values(
            databaseHosts.items.reduce(
              (acc, { uuid, name, type }) => (
                (acc[type] ??= { group: databaseTypeLabelMapping[type], items: [] }).items.push({
                  value: uuid,
                  label: name,
                }),
                acc
              ),
              {},
            ),
          )}
          searchable
          searchValue={databaseHosts.search}
          onSearchChange={databaseHosts.setSearch}
        />

        <Group mt={'md'}>
          <Button onClick={doCreate} loading={loading} disabled={!databaseHost}>
            Create
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
