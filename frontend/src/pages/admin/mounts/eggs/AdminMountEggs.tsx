import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getMountNestEggs from '@/api/admin/mounts/nest-eggs/getMountNestEggs';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import EggRow, { eggTableColumns } from '../../nests/eggs/EggRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminMountNestEggs({ mount }: { mount?: Mount }) {
  const [mountNestEggs, setMountNestEggs] = useState<
    ResponseMeta<AndCreated<{ nest: AdminNest; nestEgg: AdminNestEgg }>>
  >(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountNestEggs(mount.uuid, page, search),
    setStoreData: setMountNestEggs,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Mount Eggs</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={eggTableColumns} loading={loading} pagination={mountNestEggs} onPageSelect={setPage}>
        {mountNestEggs.data.map((nestEggMount) => (
          <EggRow key={nestEggMount.nestEgg.uuid} nest={nestEggMount.nest} egg={nestEggMount.nestEgg} />
        ))}
      </Table>
    </>
  );
}
