import { faServer } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@mantine/core';
import SubNavigation from '@/elements/SubNavigation';
import { useTranslations } from '@/providers/TranslationProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardHomeTitle() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <>
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
    </>
  );
}
