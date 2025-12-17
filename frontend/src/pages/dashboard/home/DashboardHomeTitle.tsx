import { faServer } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import AccountContentContainer from '@/elements/containers/AccountContentContainer';
import SubNavigation from '@/elements/SubNavigation.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

export default function DashboardHomeTitle() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <AccountContentContainer title='Servers'>
      <Title order={1} c='white' mb='md'>
        Servers
      </Title>

      <SubNavigation
        items={
          user?.startOnGroupedServers
            ? [
                {
                  name: t('pages.account.home.tabs.groupedServers.title', {}),
                  icon: faServer,
                  link: '/',
                },
                {
                  name: t('pages.account.home.tabs.allServers.title', {}),
                  icon: faServer,
                  link: '/all',
                },
              ]
            : [
                {
                  name: t('pages.account.home.tabs.allServers.title', {}),
                  icon: faServer,
                  link: '/',
                },
                {
                  name: t('pages.account.home.tabs.groupedServers.title', {}),
                  icon: faServer,
                  link: '/grouped',
                },
              ]
        }
      />
    </AccountContentContainer>
  );
}
