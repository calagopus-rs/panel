import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import ServerRow from '@/pages/admin/servers/ServerRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import TextInput from '@/elements/input/TextInput';
import getEggServers from '@/api/admin/nests/eggs/servers/getEggServers';
import { serverTableColumns } from '@/lib/tableColumns';

export default function AdminEggServers({
  contextNest,
  contextEgg,
}: {
  contextNest: AdminNest;
  contextEgg: AdminNestEgg;
}) {
  const [eggServers, setEggServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggServers(contextNest.uuid, contextEgg.uuid, page, search),
    setStoreData: setEggServers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Egg Servers</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={serverTableColumns} loading={loading} pagination={eggServers} onPageSelect={setPage}>
        {eggServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </>
  );
}
