import { useState } from 'react';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import EggMountAddModal from './modals/EggMountAddModal';
import EggMountRow from './EggMountRow';
import getEggMounts from '@/api/admin/nests/eggs/mounts/getEggMounts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ contextNest, contextEgg }: { contextNest: Nest; contextEgg: AdminNestEgg }) => {
  const { eggMounts, setEggMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggMounts(contextNest.uuid, contextEgg.uuid, page, search),
    setStoreData: setEggMounts,
  });

  return (
    <>
      <EggMountAddModal
        nest={contextNest}
        egg={contextEgg}
        opened={openModal === 'add'}
        onClose={() => setOpenModal(null)}
      />

      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={2}>Egg Mounts</Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('add')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Id', 'Name', 'Source', 'Target', 'Added', '']}
            pagination={eggMounts}
            onPageSelect={setPage}
          >
            {eggMounts.data.map((mount) => (
              <EggMountRow key={mount.mount.uuid} nest={contextNest} egg={contextEgg} mount={mount} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
