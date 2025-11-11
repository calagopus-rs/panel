import { faServer } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import SubNavigation from '@/elements/SubNavigation';

export default function DashboardHomeTitle() {
  return (
    <>
      <Title order={1} c={'white'} mb={'md'}>
        Servers
      </Title>

      <SubNavigation
        items={[
          {
            name: 'Grouped Servers',
            icon: faServer,
            link: '/',
          },
          {
            name: 'All Servers',
            icon: faServer,
            link: '/all',
          },
        ]}
      />
    </>
  );
}
