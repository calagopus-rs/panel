import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getEggRepositoryEggs from '@/api/admin/egg-repositories/eggs/getEggRepositoryEggs.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { eggRepositoryEggTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import EggRepositoryEggRow from './EggRepositoryEggRow.tsx';

export default function EggRepositoryEggs({ contextEggRepository }: { contextEggRepository: AdminEggRepository }) {
  const [eggRepositoryEggs, setEggRepositoryEggs] = useState(getEmptyPaginationSet<AdminEggRepositoryEgg>());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggRepositoryEggs(contextEggRepository.uuid, page, search),
    setStoreData: setEggRepositoryEggs,
  });

  return (
    <AdminContentContainer title='Egg Repository Eggs'>
      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Egg Repository Eggs</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table
        columns={eggRepositoryEggTableColumns}
        loading={loading}
        pagination={eggRepositoryEggs}
        onPageSelect={setPage}
      >
        {eggRepositoryEggs.data.map((eggRepositoryEgg) => (
          <EggRepositoryEggRow
            key={eggRepositoryEgg.uuid}
            eggRepository={contextEggRepository}
            egg={eggRepositoryEgg}
          />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
