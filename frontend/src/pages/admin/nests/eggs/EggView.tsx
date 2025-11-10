import { faCodeCommit, faCog, faEgg } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getEgg from '@/api/admin/nests/eggs/getEgg';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import EggCreateOrUpdate from '@/pages/admin/nests/eggs/EggCreateOrUpdate';
import AdminEggMounts from '@/pages/admin/nests/eggs/mounts/AdminEggMounts';
import AdminEggVariables from '@/pages/admin/nests/eggs/variables/AdminEggVariables';
import { useToast } from '@/providers/ToastProvider';

export default function EggView({ contextNest }: { contextNest: AdminNest }) {
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
            name: 'Variables',
            icon: faCodeCommit,
            link: `/admin/nests/${contextNest.uuid}/eggs/${params.eggId}/variables`,
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
        <Route path={'/variables'} element={<AdminEggVariables contextNest={contextNest} contextEgg={egg} />} />
        <Route path={'/mounts'} element={<AdminEggMounts contextNest={contextNest} contextEgg={egg} />} />
      </Routes>
    </>
  );
}
