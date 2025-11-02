import { Route, Routes, useParams } from 'react-router';
import SubNavigation from '@/elements/SubNavigation';
import { faCog, faEgg } from '@fortawesome/free-solid-svg-icons';
import AdminEggs from './eggs/AdminEggs';
import NestCreateOrUpdate from './NestCreateOrUpdate';
import { useEffect, useState } from 'react';
import getNest from '@/api/admin/nests/getNest';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';

export default () => {
  const params = useParams<'nestId'>();
  const { addToast } = useToast();
  const [nest, setNest] = useState<AdminNest | null>(null);

  useEffect(() => {
    if (params.nestId) {
      getNest(params.nestId)
        .then((nest) => {
          setNest(nest);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.nestId]);

  return !nest ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{nest.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/nests/${params.nestId}`,
          },
          {
            name: 'Eggs',
            icon: faEgg,
            link: `/admin/nests/${params.nestId}/eggs`,
          },
        ]}
      />

      <Routes>
        <Route path={'/'} element={<NestCreateOrUpdate contextNest={nest} />} />
        <Route path={'/eggs/*'} element={<AdminEggs contextNest={nest} />} />
      </Routes>
    </>
  );
};
