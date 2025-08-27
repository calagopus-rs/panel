import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';
import runSchedule from '@/api/server/schedules/triggerSchedule';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faPencil } from '@fortawesome/free-solid-svg-icons';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import Table, { TableData, TableRow } from '@/elements/Table';
import Code from '@/elements/Code';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps';
import { Group, Stack, Text, Title } from '@mantine/core';
import Card from '@/elements/Card';

interface DetailCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

export function DetailCard({ icon, label, value, subtext }: DetailCardProps) {
  return (
    <Card shadow={'sm'} padding={'lg'} radius={'md'} withBorder>
      <Group align={'flex-start'} gap={'md'}>
        <Card
          padding={'sm'}
          radius={'md'}
          withBorder
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </Card>
        <Stack gap={2}>
          <Text size={'sm'} c={'dimmed'} fw={500}>
            {label}
          </Text>
          <Text size={'lg'} fw={700}>
            {value}&nbsp;
            {subtext && (
              <Text component={'span'} size={'sm'} c={'dimmed'}>
                ({subtext})
              </Text>
            )}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

export default () => {
  const params = useParams<'id'>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const server = useServerStore((state) => state.server);

  const [page, setPage] = useState(1);
  const [schedule, setSchedule] = useState<ServerSchedule>(null);
  const [steps, setSteps] = useState<ResponseMeta<ScheduleStep>>();

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString() });
  }, [page]);

  useEffect(() => {
    getSchedule(server.uuid, params.id).then(setSchedule);
    getScheduleSteps(server.uuid, params.id, page).then(setSteps);
  }, [params.id]);

  const doRunSchedule = () => {
    runSchedule(server.uuid, params.id).then(() => {
      setSchedule((schedule) => ({ ...schedule, isProcessing: true }));
    });
  };

  return !schedule || !steps ? (
    <div className={'w-full'}>
      <Spinner.Centered />
    </div>
  ) : (
    <Stack>
      <Group justify={'space-between'}>
        <Title order={1} c={'white'}>
          {schedule.name}
        </Title>
        <Group>
          <Button
            onClick={() => navigate(`/server/${server.uuidShort}/schedules/${schedule.uuid}/edit`)}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPencil} />}
          >
            Edit
          </Button>
          {/* {steps.data.length > 0 && (
            <Button disabled={schedule.isProcessing} onClick={doRunSchedule}>
              Run
            </Button>
          )} */}
        </Group>
      </Group>

      <Group>
        {/* <DetailCard
          icon={
            schedule.isProcessing ? (
              <AnimatedHourglass />
            ) : schedule.enabled ? (
              <FontAwesomeIcon size={'xl'} icon={faHourglass} className={'text-green-500'} />
            ) : (
              <FontAwesomeIcon size={'xl'} icon={faHourglass} className={'text-red-500'} />
            )
          }
          label={'Status'}
          value={schedule.isProcessing ? 'Processing' : schedule.enabled ? 'Active' : 'Inactive'}
        /> */}
        <DetailCard
          icon={<FontAwesomeIcon size={'xl'} icon={faClockRotateLeft} />}
          label={'Last Run'}
          value={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'N/A'}
          subtext={schedule.lastRun ? formatTimestamp(schedule.lastRun).trim() : 'N/A'}
        />
        {/* <DetailCard
          icon={<FontAwesomeIcon size={'xl'} icon={faClock} />}
          label={'Next Run'}
          value={formatDateTime(getNextCronRun(schedule.cron))}
          subtext={formatTimestamp(getNextCronRun(schedule.cron))}
        /> */}
      </Group>

      <Table columns={['Sequence #', 'Action', 'Payload', 'Offset', 'Queued', 'Continue on Failure']}>
        {steps.data
          .sort((a, b) => a.order - b.order)
          .map((task) => (
            <TableRow key={task.uuid}>
              <TableData>
                <Code>{task.order}</Code>
              </TableData>
              {/* <TableData>{task.action}</TableData>
              <TableData>
                <Code>{task.payload}</Code>
              </TableData>
              <TableData>{formatMiliseconds(task.timeOffset * 1000)}</TableData>
              <TableData>{task.isQueued ? 'Yes' : 'No'}</TableData>
              <TableData>{task.continueOnFailure ? 'Yes' : 'No'}</TableData> */}
            </TableRow>
          ))}
      </Table>
    </Stack>
  );
};
