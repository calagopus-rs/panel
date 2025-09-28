import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import EggMountAddModal from './modals/EggMountAddModal';
import EggMountRow from './EggMountRow';
import getEggMounts from '@/api/admin/eggs/mounts/getEggMounts';

export default ({ contextNest, contextEgg }: { contextNest: Nest; contextEgg: AdminNestEgg }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { eggMounts, setEggMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);
  const [loading, setLoading] = useState(eggMounts.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getEggMounts(contextNest.uuid, contextEgg.uuid, page, search)
      .then((data) => {
        setEggMounts(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <EggMountAddModal
        nest={contextNest}
        egg={contextEgg}
        opened={openModal === 'add'}
        onClose={() => setOpenModal(null)}
      />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>Node Mounts</Title>
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
