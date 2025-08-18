import { Route, Routes, useParams } from 'react-router';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
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
  const [nest, setNest] = useState<Nest | null>(null);

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

      <SubNavigation>
        <SubNavigationLink to={`/admin/nests/${params.nestId}`} name={'General'} icon={faCog} />
        <SubNavigationLink to={`/admin/nests/${params.nestId}/eggs`} name={'Eggs'} icon={faEgg} end={false} />
      </SubNavigation>

      <Routes>
        <Route path={'/'} element={<NestCreateOrUpdate contextNest={nest} />} />
        <Route path={'/eggs/*'} element={<AdminEggs />} />
      </Routes>
    </>
  );
};
