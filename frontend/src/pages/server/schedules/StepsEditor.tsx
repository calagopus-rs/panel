import { faGear, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps';
import updateScheduleStepsOrder from '@/api/server/schedules/steps/updateScheduleStepsOrder';
import Button from '@/elements/Button';
import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import StepCreateOrUpdateModal from './modals/StepCreateOrUpdateModal';
import StepCard from './StepCard';
import { DndContainer, SortableItem, DndItem } from '@/elements/DragAndDrop';

interface DndScheduleStep extends ScheduleStep, DndItem {
  id: string;
}

export default function StepsEditor() {
  const params = useParams<'id'>();
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'edit' | 'create'>(null);
  const [schedule, setSchedule] = useState<ServerSchedule | null>(null);
  const [steps, setSteps] = useState<ScheduleStep[]>([]);

  const nextStepOrder = useMemo(() => Math.max(...steps.map((s) => s.order)), [steps]);

  useEffect(() => {
    if (params.id) {
      getSchedule(server.uuid, params.id).then(setSchedule);
      getScheduleSteps(server.uuid, params.id).then(setSteps);
    }
  }, [params.id, server.uuid]);

  const onStepDelete = (stepUuid: string) => {
    const newSteps = steps.filter((step) => step.uuid !== stepUuid);
    setSteps(newSteps);
  };

  const sortedSteps = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);

  if (!schedule || !steps.length) {
    return (
      <div className={'w-full'}>
        <Spinner.Centered />
      </div>
    );
  }

  const dndSteps: DndScheduleStep[] = sortedSteps.map((step) => ({
    ...step,
    id: step.uuid,
  }));

  return (
    <>
      <StepCreateOrUpdateModal
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
        schedule={schedule}
        nextStepOrder={nextStepOrder}
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
          <DndContainer
            items={dndSteps}
            callbacks={{
              onDragEnd: async (reorderedSteps) => {
                const stepsWithNewOrder = reorderedSteps.map((step, index) => ({
                  ...step,
                  order: index,
                }));
                setSteps(stepsWithNewOrder);

                try {
                  await updateScheduleStepsOrder(
                    server.uuid,
                    schedule.uuid,
                    reorderedSteps.map((s) => s.uuid),
                  );
                } catch (error) {
                  addToast(httpErrorToHuman(error), 'error');
                  setSteps(steps);
                }
              },
            }}
            renderOverlay={(activeStep) =>
              activeStep ? (
                <div style={{ cursor: 'grabbing' }}>
                  <StepCard
                    schedule={schedule}
                    step={activeStep}
                    onStepUpdate={(step) => setSteps(steps.map((s) => (s.uuid === step.uuid ? step : s)))}
                    onStepDelete={onStepDelete}
                  />
                </div>
              ) : null
            }
          >
            {(items) => (
              <Stack gap={'md'}>
                {items.map((step) => (
                  <SortableItem
                    key={step.id}
                    id={step.id}
                    renderItem={({ dragHandleProps }) => (
                      <div {...dragHandleProps}>
                        <StepCard
                          schedule={schedule}
                          step={step}
                          onStepUpdate={(step) => setSteps(steps.map((s) => (s.uuid === step.uuid ? step : s)))}
                          onStepDelete={onStepDelete}
                        />
                      </div>
                    )}
                  />
                ))}
              </Stack>
            )}
          </DndContainer>
        )}
      </Stack>
    </>
  );
}
