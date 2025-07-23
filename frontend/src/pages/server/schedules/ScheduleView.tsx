import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faClockRotateLeft, faHourglass } from '@fortawesome/free-solid-svg-icons';
import { formatDateTime, formatMiliseconds, formatTimestamp } from '@/lib/time';
import { getNextCronRun } from '@/lib/server';
import AnimatedHourglass from '@/elements/AnimatedHourglass';
import Table, { TableHead, TableHeader, TableBody, NoItems, TableRow } from '@/elements/table/Table';
import Code from '@/elements/Code';
import { Button } from '@/elements/button';
import runSchedule from '@/api/server/schedules/runSchedule';
import ScheduleCreateOrUpdateButton from './actions/ScheduleCreateOrUpdateButton';
import ScheduleDeleteButton from './actions/ScheduleDeleteButton';
import ScheduleTaskCreateOrUpdateButton from './actions/ScheduleTaskCreateOrUpdateButton';

function DetailCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className={'bg-gray-700 p-4 rounded flex gap-4'}>
      <div className={'text-gray-100 bg-gray-600 p-4 rounded-lg'}>{icon}</div>
      <div className={'flex flex-col'}>
        <span className={'text-sm text-gray-400 font-bold'}>{label}</span>
        <span className={'text-lg font-bold'}>
          {value} {subtext && <span className={'text-sm text-gray-400'}>({subtext})</span>}
        </span>
      </div>
    </div>
  );
}

export default () => {
  const params = useParams<'id'>();
  const server = useServerStore((state) => state.server);

  const [schedule, setSchedule] = useState<any | null>(null);

  useEffect(() => {
    getSchedule(server.uuid, Number(params.id)).then(setSchedule);
  }, [params.id]);

  const doRunSchedule = () => {
    runSchedule(server.uuid, Number(params.id)).then(() => {
      setSchedule((schedule) => ({ ...schedule, isProcessing: true }));
    });
  };

  return !schedule ? (
    <div className={'w-full'}>
      <Spinner.Centered />
    </div>
  ) : (
    <Container>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>{schedule.name}</h1>
        <div className={'flex gap-2'}>
          {schedule.tasks.length > 0 && (
            <Button style={Button.Styles.Gray} disabled={schedule.isProcessing} onClick={doRunSchedule}>
              Run
            </Button>
          )}
          <ScheduleCreateOrUpdateButton
            schedule={schedule}
            onUpdate={(updatedSchedule) => setSchedule(updatedSchedule)}
          />
          <ScheduleDeleteButton schedule={schedule} />
        </div>
      </div>

      <div className={'mb-4 grid grid-cols-3 gap-4'}>
        <DetailCard
          icon={
            schedule.isProcessing ? (
              <AnimatedHourglass />
            ) : schedule.isActive ? (
              <FontAwesomeIcon size={'xl'} icon={faHourglass} className={'text-green-500'} />
            ) : (
              <FontAwesomeIcon size={'xl'} icon={faHourglass} className={'text-red-500'} />
            )
          }
          label={'Status'}
          value={schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}
        />
        <DetailCard
          icon={<FontAwesomeIcon size={'xl'} icon={faClockRotateLeft} />}
          label={'Last Run'}
          value={schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : 'N/A'}
          subtext={schedule.lastRunAt ? formatTimestamp(schedule.lastRunAt).trim() : 'N/A'}
        />
        <DetailCard
          icon={<FontAwesomeIcon size={'xl'} icon={faClock} />}
          label={'Next Run'}
          value={formatDateTime(getNextCronRun(schedule.cron))}
          subtext={formatTimestamp(getNextCronRun(schedule.cron))}
        />
      </div>

      <div className={'mb-2 flex justify-end'}>
        <ScheduleTaskCreateOrUpdateButton
          schedule={schedule}
          onSubmit={(task) => setSchedule({ ...schedule, tasks: [...schedule.tasks, task] })}
        />
      </div>
      <Table>
        <div className={'overflow-x-auto'}>
          <table className={'w-full table-auto'}>
            <TableHead>
              <TableHeader name={'Sequence #'} />
              <TableHeader name={'Action'} />
              <TableHeader name={'Payload'} />
              <TableHeader name={'Offset'} />
              <TableHeader name={'Queued'} />
              <TableHeader name={'Continue on Failure'} />
            </TableHead>

            <TableBody>
              {schedule.tasks
                .sort((a, b) => a.sequenceId - b.sequenceId)
                .map((task) => (
                  <TableRow key={task.id}>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                      <Code>{task.sequenceId}</Code>
                    </td>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>{task.action}</td>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                      <Code>{task.payload}</Code>
                    </td>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                      {formatMiliseconds(task.timeOffset * 1000)}
                    </td>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                      {task.isQueued ? 'Yes' : 'No'}
                    </td>
                    <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
                      {task.continueOnFailure ? 'Yes' : 'No'}
                    </td>
                  </TableRow>
                ))}
            </TableBody>
          </table>

          {schedule.tasks.length === 0 ? <NoItems /> : null}
        </div>
      </Table>
    </Container>
  );
};
