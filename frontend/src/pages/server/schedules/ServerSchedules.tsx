import getSchedules from '@/api/server/schedules/getSchedules';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import CronExpressionParser, { CronDate } from 'cron-parser';
import cronstrue from 'cronstrue';
import { useEffect, useState } from 'react';

const ActiveBadge = () => (
  <div className="inline-block rounded bg-green-500 px-2 py-1 text-xs font-bold text-green-100">Active</div>
);

const InactiveBadge = () => (
  <div className="inline-block rounded bg-red-500 px-2 py-1 text-xs font-bold text-red-100">Inactive</div>
);

export default () => {
  const server = useServerStore(state => state.data);
  const { schedules, setSchedules } = useServerStore(state => state.schedules);

  const [loading, setLoading] = useState(schedules.length === 0);

  useEffect(() => {
    getSchedules(server.uuid).then(data => {
      setSchedules(data);
      setLoading(false);
    });
  }, []);

  const toCronExpression = (cron: CronObject) => {
    return `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;
  };

  const getNextRun = (cron: CronObject): CronDate => {
    const interval = CronExpressionParser.parse(toCronExpression(cron));
    return interval.next();
  };

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Schedules</h1>
        <div className="flex gap-2">
          <Button>Create new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name={'Name'} />
                <TableHeader name={'Frequency'} />
                <TableHeader name={'Last Run'} />
                <TableHeader name={'Next Run'} />
                <TableHeader name={'Status'} />
              </TableHead>

              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={schedule.name}>
                      {schedule.name}
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      <Tooltip content={toCronExpression(schedule.cron)}>
                        {cronstrue.toString(toCronExpression(schedule.cron))}
                      </Tooltip>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      <Tooltip content={schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : 'N/A'}>
                        {schedule.lastRunAt ? formatTimestamp(schedule.lastRunAt) : 'N/A'}
                      </Tooltip>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      <Tooltip content={formatDateTime(getNextRun(schedule.cron))}>
                        {formatTimestamp(getNextRun(schedule.cron))}
                      </Tooltip>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      {schedule.isActive ? <ActiveBadge /> : <InactiveBadge />}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </table>

            {loading ? <Spinner.Centered /> : schedules.length === 0 ? <NoItems /> : null}
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
