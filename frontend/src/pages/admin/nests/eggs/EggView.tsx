import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog, faEgg } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getEgg from '@/api/admin/eggs/getEgg';
import EggCreateOrUpdate from '@/pages/admin/nests/eggs/EggCreateOrUpdate';
import AdminEggMounts from '@/pages/admin/nests/eggs/mounts/AdminEggMounts';

export default ({ contextNest }: { contextNest: Nest }) => {
  const params = useParams<'eggId'>();
  const { addToast } = useToast();
  const [egg, setEgg] = useState<AdminNestEgg | null>(null);

  useEffect(() => {
    if (params.eggId) {
      getEgg(contextNest.uuid, params.eggId)
        .then((egg) => {
          setEgg(egg);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.eggId]);

  return !contextNest || !egg ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={2}>{egg?.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/nests/${contextNest.uuid}/eggs/${params.eggId}`,
          },
          {
            name: 'Mounts',
            icon: faEgg,
            link: `/admin/nests/${contextNest.uuid}/eggs/${params.eggId}/mounts`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<EggCreateOrUpdate contextNest={contextNest} contextEgg={egg} />} />
        <Route path={'/mounts'} element={<AdminEggMounts contextNest={contextNest} contextEgg={egg} />} />
      </Routes>
    </>
  );
};
