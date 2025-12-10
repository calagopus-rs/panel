import { Group } from '@mantine/core';
import { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import getServerGroups from '@/api/me/servers/groups/getServerGroups';
import getServers from '@/api/server/getServers';
import Divider from '@/elements/Divider';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import { Pagination } from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useGlobalStore } from '@/stores/global';
import { useUserStore } from '@/stores/user';
import DashboardHomeTitle from './DashboardHomeTitle';
import ServerItem from './ServerItem';
import { useTranslations } from '@/providers/TranslationProvider';

export default function DashboardHomeAll() {
  const { t } = useTranslations();
  const { servers, setServers, setServerGroups } = useUserStore();
  const { serverListShowOthers, setServerListShowOthers } = useGlobalStore();
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    getServerGroups()
      .then((response) => {
        setServerGroups(response);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [addToast, setServerGroups]);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServers(page, search, serverListShowOthers),
    setStoreData: setServers,
    deps: [serverListShowOthers],
  });

  return (
    <>
      <DashboardHomeTitle />

      <Group mb='md' justify='space-between'>
        <TextInput
          placeholder={t('common.input.search', {})}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={250}
        />
        {user!.admin && (
          <Switch
            label={t('pages.account.home.tabs.allServers.page.input.showOtherUsersServers', {})}
            checked={serverListShowOthers}
            onChange={(e) => setServerListShowOthers(e.currentTarget.checked)}
          />
        )}
      </Group>

      {servers.total > servers.perPage && (
        <>
          <Pagination data={servers} onPageSelect={setPage} />
          <Divider my='md' />
        </>
      )}

      {loading ? (
        <Spinner.Centered />
      ) : servers.total === 0 ? (
        <p className='text-gray-400'>{t('pages.account.home.noServers', {})}</p>
      ) : (
        <div className='gap-4 grid md:grid-cols-2'>
          {servers.data.map((server) => (
            <ServerItem key={server.uuid} server={server} showGroupAddButton={!serverListShowOthers} />
          ))}
        </div>
      )}

      {servers.total > servers.perPage && (
        <>
          <Divider my='md' />
          <Pagination data={servers} onPageSelect={setPage} />
        </>
      )}
    </>
  );
}
