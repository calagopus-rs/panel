import { faCog, faComputer, faEgg, faServer } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getMount from '@/api/admin/mounts/getMount';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import MountCreateOrUpdate from '@/pages/admin/mounts/MountCreateOrUpdate';
import { useToast } from '@/providers/ToastProvider';
import AdminMountNestEggs from './nest-eggs/AdminMountNestEggs';
import AdminMountNodes from './nodes/AdminMountNodes';
import AdminMountServers from './servers/AdminMountServers';

export default function MountView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const [mount, setMount] = useState<Mount | null>(null);

  useEffect(() => {
    if (params.id) {
      getMount(params.id)
        .then((mount) => {
          setMount(mount);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return !mount ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{mount.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/mounts/${params.id}`,
          },
          {
            name: 'Nest Eggs',
            icon: faEgg,
            link: `/admin/mounts/${params.id}/nest-eggs`,
          },
          {
            name: 'Nodes',
            icon: faServer,
            link: `/admin/mounts/${params.id}/nodes`,
          },
          {
            name: 'Servers',
            icon: faComputer,
            link: `/admin/mounts/${params.id}/servers`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<MountCreateOrUpdate contextMount={mount} />} />
        <Route path={'/nest-eggs'} element={<AdminMountNestEggs mount={mount} />} />
        <Route path={'/nodes'} element={<AdminMountNodes mount={mount} />} />
        <Route path={'/servers'} element={<AdminMountServers mount={mount} />} />
      </Routes>
    </>
  );
}
