import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import getNest from '@/api/admin/nests/getNest';
import { SubNavigation, SubNavigationLink } from '@/elements/SubNavigation';
import { faCog, faEgg } from '@fortawesome/free-solid-svg-icons';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import NestSettingsContainer from './NestSettingsContainer';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();

  const [nest, setNest] = useState<Nest | null>(null);

  useEffect(() => {
    if (params.id) {
      getNest(Number(params.id))
        .then((nest) => {
          setNest(nest);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  return (
    <Container>
      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>Update Nest</h1>
      </div>

      <SubNavigation>
        <SubNavigationLink to={`/admin/nests/${nest?.id}`} name={'General'} icon={faCog} />
        <SubNavigationLink to={`/admin/nests/${nest?.id}/eggs`} name={'Eggs'} icon={faEgg} />
      </SubNavigation>

      {!nest ? (
        <Spinner.Centered />
      ) : (
        <Routes>
          <Route path={'/'} element={<NestSettingsContainer nest={nest} />} />
          <Route path={'/eggs'} element={<></>} />
        </Routes>
      )}
    </Container>
  );
};
