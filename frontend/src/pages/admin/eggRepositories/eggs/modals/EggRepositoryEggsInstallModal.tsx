import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import installEgg from '@/api/admin/egg-repositories/eggs/installEgg';
import getNests from '@/api/admin/nests/getNests';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';

export default function EggRepositoryEggsInstallModal({
  eggRepository,
  egg,
  opened,
  onClose,
}: ModalProps & { eggRepository: AdminEggRepository; egg: AdminEggRepositoryEgg }) {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedNest, setSelectedNest] = useState<AdminNest | null>(null);

  const nests = useSearchableResource<AdminNest>({ fetcher: (search) => getNests(1, search) });

  useEffect(() => {
    if (!opened) {
      nests.setSearch('');
      setSelectedNest(null);
    }
  }, [opened]);

  const doInstall = () => {
    setLoading(true);

    installEgg(eggRepository.uuid, egg.uuid, selectedNest!.uuid)
      .then(() => {
        addToast('Egg installed.', 'success');

        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Install Egg Repository Egg' onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label='Nest'
          placeholder='Nest'
          value={selectedNest?.uuid}
          onChange={(value) => setSelectedNest(nests.items.find((m) => m.uuid === value) ?? null)}
          data={nests.items.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
          }))}
          searchable
          searchValue={nests.search}
          onSearchChange={nests.setSearch}
        />

        <Group mt='md'>
          <Button onClick={doInstall} loading={loading} disabled={!selectedNest}>
            Install
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
