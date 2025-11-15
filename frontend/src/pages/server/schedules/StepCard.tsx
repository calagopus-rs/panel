import { faGear, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { join } from 'pathe';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import deleteScheduleStep from '@/api/server/schedules/steps/deleteScheduleStep';
import Card from '@/elements/Card';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { scheduleStepIconMapping, scheduleStepLabelMapping } from '@/lib/enums';
import { formatMiliseconds } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import StepCreateOrUpdateModal from './modals/StepCreateOrUpdateModal';

interface Props {
  schedule: ServerSchedule;
  step: ScheduleStep;
  onStepUpdate: (step: ScheduleStep) => void;
  onStepDelete: (stepUuid: string) => void;
}

export default function StepCard({ schedule, step, onStepUpdate, onStepDelete }: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [openModal, setOpenModal] = useState<'update' | 'delete'>(null);

  const doDelete = async () => {
    await deleteScheduleStep(server.uuid, schedule.uuid, step.uuid)
      .then(() => {
        addToast('Schedule step deleted.', 'success');
        onStepDelete(step.uuid);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Card>
      <StepCreateOrUpdateModal
        opened={openModal === 'update'}
        onClose={() => setOpenModal(null)}
        schedule={schedule}
        propStep={step}
        onStepUpdate={onStepUpdate}
      />

      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Schedule Step Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete this schedule step?
      </ConfirmationModal>

      <Group justify={'space-between'} align={'flex-start'}>
        <Group gap={'md'} align={'flex-start'}>
          <ThemeIcon size={'lg'} color={'gray'}>
            <FontAwesomeIcon icon={scheduleStepIconMapping[step.action.type] || faGear} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text fw={600}>{scheduleStepLabelMapping[step.action.type] || step.action.type}</Text>
            <Text size={'sm'} c={'dimmed'}>
              {step.action.type === 'sleep' ? (
                <span>Sleep for {step.action.duration}ms</span>
              ) : step.action.type === 'wait_for_console_line' ? (
                <span>
                  Wait {formatMiliseconds(step.action.timeout)} for console line containing "{step.action.contains}"
                </span>
              ) : step.action.type === 'send_power' ? (
                <span>Do {step.action.action}</span>
              ) : step.action.type === 'send_command' ? (
                <span>
                  Run <Code>{step.action.command.substring(0, 30)}...</Code>
                </span>
              ) : step.action.type === 'create_backup' ? (
                <span>Create {step.action.name || 'Auto-generated'}</span>
              ) : step.action.type === 'create_directory' ? (
                <span>
                  Create <Code>{join(step.action.root, step.action.name)}</Code>
                </span>
              ) : step.action.type === 'write_file' ? (
                <span>
                  Write to <Code>{step.action.file}</Code>
                </span>
              ) : step.action.type === 'copy_file' ? (
                <span>
                  Copy <Code>{step.action.file}</Code> to <Code>{step.action.destination}</Code>
                </span>
              ) : step.action.type === 'delete_files' ? (
                <span>
                  Delete <Code>{step.action.files.join(', ')}</Code>
                </span>
              ) : step.action.type === 'rename_files' ? (
                <span>Rename {step.action.files.length} files</span>
              ) : step.action.type === 'compress_files' ? (
                <span>
                  Compress {step.action.files.length} files to <Code>{join(step.action.root, step.action.name)}</Code>
                </span>
              ) : step.action.type === 'decompress_file' ? (
                <span>
                  Decompress <Code>{step.action.file}</Code> to <Code>{step.action.root}</Code>
                </span>
              ) : step.action.type === 'update_startup_variable' ? (
                <span>
                  Set <Code>{step.action.envVariable}</Code> to <Code>{step.action.value}</Code>
                </span>
              ) : step.action.type === 'update_startup_command' ? (
                <span>
                  Set to <Code>{step.action.command}</Code>
                </span>
              ) : step.action.type === 'update_startup_docker_image' ? (
                <span>
                  Set to <Code>{step.action.image}</Code>
                </span>
              ) : (
                <span>Select an action type to configure</span>
              )}
            </Text>
          </Stack>
        </Group>

        <Group gap={'xs'}>
          <ActionIcon color={'blue'} onClick={() => setOpenModal('update')}>
            <FontAwesomeIcon icon={faPencil} />
          </ActionIcon>
          <ActionIcon color={'red'} onClick={() => setOpenModal('delete')}>
            <FontAwesomeIcon icon={faTrash} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}
