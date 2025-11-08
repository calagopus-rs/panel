import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getMount from '@/api/admin/mounts/getMount';
import MountCreateOrUpdate from '@/pages/admin/mounts/MountCreateOrUpdate';

export default () => {
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
        ]}
      />

      <Routes>
        <Route path={'/'} element={<MountCreateOrUpdate contextMount={mount} />} />
      </Routes>
    </>
  );
};
