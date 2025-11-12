import { Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import EggRow, { eggTableColumns } from '../../nests/eggs/EggRow';
import getMountNestEggs from '@/api/admin/mounts/nest-eggs/getMountNestEggs';

export default function AdminMountNestEggs({ mount }: { mount?: Mount }) {
  const [mountNestEggs, setMountNestEggs] = useState<
    ResponseMeta<AndCreated<{ nest: AdminNest; nestEgg: AdminNestEgg }>>
  >(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountNestEggs(mount.uuid, page, search),
    setStoreData: setMountNestEggs,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Mount Nest Eggs
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={eggTableColumns} pagination={mountNestEggs} onPageSelect={setPage}>
          {mountNestEggs.data.map((nestEggMount) => (
            <EggRow key={nestEggMount.nestEgg.uuid} nest={nestEggMount.nest} egg={nestEggMount.nestEgg} />
          ))}
        </Table>
      )}
    </>
  );
}
