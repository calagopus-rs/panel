import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import EggRepositoryEggRow from './EggRepositoryEggRow';
import getEggRepositoryEggs from '@/api/admin/egg-repositories/eggs/getEggRepositoryEggs';
import { eggRepositoryEggTableColumns } from '@/lib/tableColumns';

export default function EggRepositoryEggs({ contextEggRepository }: { contextEggRepository: AdminEggRepository }) {
  const [eggRepositoryEggs, setEggRepositoryEggs] = useState(getEmptyPaginationSet<AdminEggRepositoryEgg>());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggRepositoryEggs(contextEggRepository.uuid, page, search),
    setStoreData: setEggRepositoryEggs,
  });

  return (
    <>
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
    </>
  );
}
