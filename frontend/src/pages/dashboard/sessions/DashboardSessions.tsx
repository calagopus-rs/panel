import { Group, Title } from '@mantine/core';
import getSessions from '@/api/me/sessions/getSessions.ts';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import SessionRow from './SessionRow.tsx';

export default function DashboardSessions() {
  const { t } = useTranslations();
  const { sessions, setSessions } = useUserStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSessions,
    setStoreData: setSessions,
  });

  return (
    <AccountContentContainer title={t('pages.account.sessions.title', {})}>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          {t('pages.account.sessions.title', {})}
        </Title>
        <Group>
          <TextInput
            placeholder={t('common.input.search', {})}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w={250}
          />
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={[
            t('pages.account.sessions.table.columns.ip', {}),
            t('pages.account.sessions.table.columns.thisDevice', {}),
            t('pages.account.sessions.table.columns.userAgent', {}),
            t('common.table.columns.lastUsed', {}),
            '',
          ]}
          loading={loading}
          pagination={sessions}
          onPageSelect={setPage}
        >
          {sessions.data.map((session) => (
            <SessionRow key={session.uuid} session={session} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AccountContentContainer>
  );
}
