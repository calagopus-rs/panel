import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Divider, Group, ModalProps, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import createScheduleStep from '@/api/server/schedules/steps/createScheduleStep';
import updateScheduleStep from '@/api/server/schedules/steps/updateScheduleStep';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { scheduleStepDefaultMapping, scheduleStepLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import StepCompressFiles from '../steps/StepCompressFiles';
import StepCopyFile from '../steps/StepCopyFile';
import StepCreateBackup from '../steps/StepCreateBackup';
import StepCreateDirectory from '../steps/StepCreateDirectory';
import StepDecompressFile from '../steps/StepDecompressFile';
import StepDeleteFiles from '../steps/StepDeleteFiles';
import StepRenameFiles from '../steps/StepRenameFiles';
import StepSendCommand from '../steps/StepSendCommand';
import StepSendPower from '../steps/StepSendPower';
import StepSleep from '../steps/StepSleep';
import StepUpdateStartupCommand from '../steps/StepUpdateStartupCommand';
import StepUpdateStartupDockerImage from '../steps/StepUpdateStartupDockerImage';
import StepUpdateStartupVariable from '../steps/StepUpdateStartupVariable';
import StepWaitForConsoleLine from '../steps/StepWaitForConsoleLine';
import StepWriteFile from '../steps/StepWriteFile';

type Props = ModalProps & {
  schedule: ServerSchedule;
  propStep?: ScheduleStep;
  nextStepOrder?: number;
  onStepCreate?: (step: ScheduleStep) => void;
  onStepUpdate?: (step: ScheduleStep) => void;
};

export default function StepCreateOrUpdateModal({
  schedule,
  propStep,
  nextStepOrder,
  onStepCreate,
  onStepUpdate,
  opened,
  onClose,
}: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<ScheduleStep>(
    propStep ||
      ({
        action: scheduleStepDefaultMapping.sleep,
        order: 1,
      } as ScheduleStep),
  );

  useEffect(() => {
    if (propStep) {
      setStep(propStep);
    } else {
      setStep({
        action: scheduleStepDefaultMapping.sleep,
        order: 1,
      } as ScheduleStep);
    }
  }, [propStep, opened]);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (propStep) {
      updateScheduleStep(server.uuid, schedule.uuid, propStep.uuid, step)
        .then(() => {
          onClose();
          addToast('Schedule step updated.', 'success');
          onStepUpdate?.(step);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    } else {
      createScheduleStep(server.uuid, schedule.uuid, { ...step, order: nextStepOrder })
        .then((step) => {
          onClose();
          addToast('Schedule step created.', 'success');
          onStepCreate?.(step);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={step ? 'Edit Schedule Step' : 'Create Schedule Step'} size={'lg'}>
      <Stack gap={'md'}>
        <Select
          label={'Action Type'}
          data={Object.entries(scheduleStepLabelMapping).map(([value, label]) => ({
            value,
            label,
          }))}
          value={step.action.type}
          onChange={(value) => setStep({ ...step, action: scheduleStepDefaultMapping[value] })}
        />

        <Divider />

        {step.action.type === 'sleep' ? (
          <StepSleep action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'wait_for_console_line' ? (
          <StepWaitForConsoleLine action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'send_power' ? (
          <StepSendPower action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'send_command' ? (
          <StepSendCommand action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'create_backup' ? (
          <StepCreateBackup action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'create_directory' ? (
          <StepCreateDirectory action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'write_file' ? (
          <StepWriteFile action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'copy_file' ? (
          <StepCopyFile action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'delete_files' ? (
          <StepDeleteFiles action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'rename_files' ? (
          <StepRenameFiles action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'compress_files' ? (
          <StepCompressFiles action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'decompress_file' ? (
          <StepDecompressFile action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'update_startup_variable' ? (
          <StepUpdateStartupVariable action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'update_startup_command' ? (
          <StepUpdateStartupCommand action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : step.action.type === 'update_startup_docker_image' ? (
          <StepUpdateStartupDockerImage action={step.action} setAction={(action) => setStep({ ...step, action })} />
        ) : (
          <Text c={'dimmed'}>Select an action type to configure</Text>
        )}

        <Group justify={'flex-end'} mt={'md'}>
          <Button variant={'outline'} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doCreateOrUpdate} leftSection={<FontAwesomeIcon icon={faSave} />} loading={loading}>
            {propStep ? 'Update Step' : 'Create Step'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
