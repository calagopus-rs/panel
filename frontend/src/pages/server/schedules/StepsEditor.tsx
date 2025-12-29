import { faGear, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { memo, useMemo, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateScheduleStepsOrder from '@/api/server/schedules/steps/updateScheduleStepsOrder.ts';
import Button from '@/elements/Button.tsx';
import { DndContainer, DndItem, SortableItem } from '@/elements/DragAndDrop.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import StepCreateOrUpdateModal from './modals/StepCreateOrUpdateModal.tsx';
import StepCard from './StepCard.tsx';

interface DndScheduleStep extends ScheduleStep, DndItem {
  id: string;
}

const MemoizedStepCard = memo(StepCard);

export default function StepsEditor({ schedule }: { schedule: ServerSchedule }) {
  const { server, scheduleSteps, setScheduleSteps } = useServerStore();
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'edit' | 'create' | null>(null);

  const nextStepOrder = useMemo(
    () =>
      Number.isFinite(Math.max(...scheduleSteps.map((s) => s.order)))
        ? Math.max(...scheduleSteps.map((s) => s.order))
        : 1,
    [scheduleSteps],
  );

  const onStepDelete = (stepUuid: string) => {
    const newSteps = scheduleSteps.filter((step) => step.uuid !== stepUuid);
    setScheduleSteps(newSteps);
  };

  const sortedSteps = useMemo(() => [...scheduleSteps].sort((a, b) => a.order - b.order), [scheduleSteps]);

  if (!schedule || !scheduleSteps) {
    return (
      <div className='w-full'>
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
        onStepCreate={(step) => setScheduleSteps([...scheduleSteps, step])}
      />

      <Stack>
        <Group justify='space-between'>
          <Button onClick={() => setOpenModal('create')} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add Step
          </Button>
        </Group>

        {sortedSteps.length === 0 ? (
          <Paper withBorder p='xl' radius='md' style={{ textAlign: 'center' }}>
            <ThemeIcon size='xl' mb='md' color='gray'>
              <FontAwesomeIcon icon={faGear} />
            </ThemeIcon>
            <Title order={3} c='dimmed' mb='sm'>
              No Steps Configured
            </Title>
            <Text c='dimmed' mb='md'>
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
                  order: index + 1,
                }));
                setScheduleSteps(stepsWithNewOrder);

                await updateScheduleStepsOrder(
                  server.uuid,
                  schedule.uuid,
                  reorderedSteps.map((s) => s.uuid),
                ).catch((err) => {
                  addToast(httpErrorToHuman(err), 'error');
                  setScheduleSteps(scheduleSteps);
                });
              },
            }}
            renderOverlay={(activeStep) =>
              activeStep ? (
                <div style={{ cursor: 'grabbing' }}>
                  <MemoizedStepCard
                    schedule={schedule}
                    step={activeStep}
                    onStepUpdate={(step) =>
                      setScheduleSteps(scheduleSteps.map((s) => (s.uuid === step.uuid ? step : s)))
                    }
                    onStepDelete={onStepDelete}
                  />
                </div>
              ) : null
            }
          >
            {(items) => (
              <Stack gap='md'>
                {items.map((step) => (
                  <SortableItem
                    key={step.id}
                    id={step.id}
                    renderItem={({ dragHandleProps }) => (
                      <div {...dragHandleProps}>
                        <MemoizedStepCard
                          schedule={schedule}
                          step={step}
                          onStepUpdate={(step) =>
                            setScheduleSteps(scheduleSteps.map((s) => (s.uuid === step.uuid ? step : s)))
                          }
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
