import { Group } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import getServerActivity from '@/api/server/getServerActivity.ts';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton.tsx';
import Code from '@/elements/Code.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Table, { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function ServerActivity() {
  const { t } = useTranslations();
  const [activities, setActivities] = useState<ResponseMeta<ServerActivity>>(getEmptyPaginationSet());
  const server = useServerStore((state) => state.server);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerActivity(server.uuid, page, search),
    setStoreData: setActivities,
  });

  return (
    <ServerContentContainer title={t('pages.server.activity.title', {})} search={search} setSearch={setSearch}>
      <Table
        columns={[
          '',
          t('common.table.columns.actor', {}),
          t('common.table.columns.event', {}),
          t('common.table.columns.ip', {}),
          t('common.table.columns.when', {}),
          '',
        ]}
        loading={loading}
        pagination={activities}
        onPageSelect={setPage}
      >
        {activities.data.map((activity) => (
          <TableRow key={activity.created.toString()}>
            <TableData>
              <div className='size-5 aspect-square relative'>
                <img
                  src={activity.user?.avatar ?? '/icon.svg'}
                  alt={activity.user?.username}
                  className='size-5 object-cover rounded-full select-none'
                />
              </div>
            </TableData>

            <TableData>
              {activity.user ? `${activity.user.username} (${activity.isApi ? 'API' : 'Web'})` : t('common.system', {})}
            </TableData>

            <TableData>
              <Code>{activity.event}</Code>
            </TableData>

            <TableData>{activity.ip && <Code>{activity.ip}</Code>}</TableData>

            <TableData>
              <Tooltip label={formatDateTime(activity.created)}>{formatTimestamp(activity.created)}</Tooltip>
            </TableData>

            <TableData>
              <Group gap={4} justify='right' wrap='nowrap'>
                {Object.keys(activity.data ?? {}).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
              </Group>
            </TableData>
          </TableRow>
        ))}
      </Table>
    </ServerContentContainer>
  );
}
