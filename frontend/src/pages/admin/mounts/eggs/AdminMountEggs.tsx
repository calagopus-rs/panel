import { useState } from 'react';
import getMountNestEggs from '@/api/admin/mounts/nest-eggs/getMountNestEggs.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { eggTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import EggRow from '../../nests/eggs/EggRow.tsx';

export default function AdminMountNestEggs({ mount }: { mount: Mount }) {
  const [mountNestEggs, setMountNestEggs] = useState<
    ResponseMeta<AndCreated<{ nest: AdminNest; nestEgg: AdminNestEgg }>>
  >(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountNestEggs(mount.uuid, page, search),
    setStoreData: setMountNestEggs,
  });

  return (
    <AdminContentContainer title='Mount Eggs' titleOrder={2} search={search} setSearch={setSearch}>
      <Table columns={eggTableColumns} loading={loading} pagination={mountNestEggs} onPageSelect={setPage}>
        {mountNestEggs.data.map((nestEggMount) => (
          <EggRow key={nestEggMount.nestEgg.uuid} nest={nestEggMount.nest} egg={nestEggMount.nestEgg} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
