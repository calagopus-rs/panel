import getServerActivity from '@/api/server/getServerActivity';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import Spinner from '@/elements/Spinner';
import Table, {
  ContentWrapper,
  TableHead,
  TableHeader,
  TableBody,
  NoItems,
  TableRow,
  Pagination,
} from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<ResponseMeta<ServerActivity>>();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getServerActivity(server.uuid, page, search).then((data) => {
      setActivities(data);
      setLoading(false);
    });
  }, [page, search]);

  return (
    <>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>Activity</h1>
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper onSearch={setSearch}>
            <Pagination data={activities} onPageSelect={setPage}>
              <div className={'overflow-x-auto'}>
                <table className={'w-full table-auto'}>
                  <TableHead>
                    <TableHeader name={'Actor'} />
                    <TableHeader name={'Event'} />
                    <TableHeader name={'IP'} />
                    <TableHeader name={'When'} />
                    <TableHeader />
                  </TableHead>

                  <TableBody>
                    {activities.data.map((activity) => (
                      <TableRow key={activity.created.toString()}>
                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {activity.user ? `${activity.user.username} (${activity.isApi ? 'API' : 'Web'})` : 'System'}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Code>{activity.event}</Code>
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          {activity.ip && <Code>{activity.ip}</Code>}
                        </td>

                        <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                          <Tooltip content={formatDateTime(activity.created)}>
                            {formatTimestamp(activity.created)}
                          </Tooltip>
                        </td>

                        <td className={'relative'}>
                          {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
                        </td>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>

                {activities.data.length === 0 ? <NoItems /> : null}
              </div>
            </Pagination>
          </ContentWrapper>
        </Table>
      )}
    </>
  );
};
