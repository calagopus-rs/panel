import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Spinner from '@/elements/Spinner';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import getSchedule from '@/api/server/schedules/getSchedule';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps';
import StepCreateOrUpdateModal from './modals/StepCreateOrUpdateModal';
import StepCard from './StepCard';

export default () => {
  const params = useParams<'id'>();
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);

  const [openModal, setOpenModal] = useState<'edit' | 'create'>(null);
  const [schedule, setSchedule] = useState<ServerSchedule | null>(null);
  const [steps, setSteps] = useState<ScheduleStep[]>([]);

  useEffect(() => {
    if (params.id) {
      getSchedule(server.uuid, params.id).then(setSchedule);
      getScheduleSteps(server.uuid, params.id).then(setSteps);
    }
  }, [params.id]);

  const onStepDelete = (stepUuid: string) => {
    const newSteps = steps.filter((step) => step.uuid !== stepUuid);
    setSteps(newSteps);
  };

  if (!schedule || !steps) {
    return (
      <div className={'w-full'}>
        <Spinner.Centered />
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <>
      <StepCreateOrUpdateModal
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
        schedule={schedule}
        onStepCreate={(step) => setSteps([...steps, step])}
      />

      <Stack>
        <Group justify={'space-between'}>
          <Stack gap={4}>
            <Title order={1} c={'white'}>
              Manage Steps: {schedule.name}
            </Title>
            <Text c={'dimmed'}>Configure the actions that will be executed when this schedule runs</Text>
          </Stack>

          <Group>
            <Button
              onClick={() => navigate(`/server/${server.uuidShort}/schedules/${schedule.uuid}`)}
              variant={'outline'}
            >
              Back to Schedule
            </Button>
            <Button onClick={() => setOpenModal('create')} leftSection={<FontAwesomeIcon icon={faPlus} />}>
              Add Step
            </Button>
          </Group>
        </Group>

        {sortedSteps.length === 0 ? (
          <Paper withBorder p={'xl'} radius={'md'} style={{ textAlign: 'center' }}>
            <ThemeIcon size={'xl'} mb={'md'} color={'gray'}>
              <FontAwesomeIcon icon={faGear} />
            </ThemeIcon>
            <Title order={3} c={'dimmed'} mb={'sm'}>
              No Steps Configured
            </Title>
            <Text c={'dimmed'} mb={'md'}>
              This schedule doesn&apos;t have any steps yet. Add some actions to get started.
            </Text>
            <Button onClick={() => setOpenModal('create')} leftSection={<FontAwesomeIcon icon={faPlus} />}>
              Create First Step
            </Button>
          </Paper>
        ) : (
          <Stack gap={'md'}>
            {sortedSteps.map((step) => (
              <StepCard
                key={step.uuid}
                schedule={schedule}
                step={step}
                onStepUpdate={(step) => setSteps(steps.map((s) => (s.uuid === step.uuid ? step : s)))}
                onStepDelete={onStepDelete}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
};
