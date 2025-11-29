import { faCog, faEgg } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Route, Routes, useParams } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import SubNavigation from '@/elements/SubNavigation';
import { useToast } from '@/providers/ToastProvider';
import EggRepositoryCreateOrUpdate from './EggRepositoryCreateOrUpdate';
import getEggRepository from '@/api/admin/egg-repositories/getEggRepository';
import EggRepositoryEggs from './eggs/EggRepositoryEggs';

export default function EggRepositoryView() {
  const params = useParams<'eggRepositoryId'>();
  const { addToast } = useToast();
  const [eggRepository, setEggRepository] = useState<AdminEggRepository | null>(null);

  useEffect(() => {
    if (params.eggRepositoryId) {
      getEggRepository(params.eggRepositoryId)
        .then((eggRepository) => {
          setEggRepository(eggRepository);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.eggRepositoryId]);

  return !eggRepository ? (
    <Spinner.Centered />
  ) : (
    <>
      <Title order={1}>{eggRepository.name}</Title>

      <SubNavigation
        items={[
          {
            name: 'General',
            icon: faCog,
            link: `/admin/egg-repositories/${params.eggRepositoryId}`,
          },
          {
            name: 'Eggs',
            icon: faEgg,
            link: `/admin/egg-repositories/${params.eggRepositoryId}/eggs`,
          },
        ]}
      />

      <Routes>
        <Route path='/' element={<EggRepositoryCreateOrUpdate contextEggRepository={eggRepository} />} />
        <Route path='/eggs' element={<EggRepositoryEggs contextEggRepository={eggRepository} />} />
      </Routes>
    </>
  );
}
