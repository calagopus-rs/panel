import getUserActivity from '@/api/me/getUserActivity';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
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
import { useEffect, useState } from 'react';

export default () => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activities, setActivities] = useState<ResponseMeta<UserActivity>>();

  useEffect(() => {
    getUserActivity(page).then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, [page]);

  return (
    <Container>
      <div className="justify-between flex items-center mb-2">
        <h1 className="text-4xl font-bold text-white">Activity</h1>
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table>
          <ContentWrapper>
            <Pagination data={activities} onPageSelect={setPage}>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <TableHead>
                    <TableHeader name="Actor" />
                    <TableHeader name="Event" />
                    <TableHeader name="IP" />
                    <TableHeader name="When" />
                  </TableHead>

                  <TableBody>
                    {activities.data.map(activity => (
                      <TableRow key={activity.id}>
                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          {activity.isApi ? 'API' : 'Web'}
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          <Code>{activity.event}</Code>
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          <Code>{activity.ip}</Code>
                        </td>

                        <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                          <Tooltip content={formatDateTime(activity.created)}>
                            {formatTimestamp(activity.created)}
                          </Tooltip>
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
    </Container>
  );
};
