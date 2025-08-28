import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Spinner from '@/elements/Spinner';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faArrowUp,
  faArrowDown,
  faSave,
  faHourglass,
  faPowerOff,
  faTerminal,
  faDatabase,
  faFolder,
  faFile,
  faCopy,
  faCompress,
  faExpand,
  faGear,
  faCode,
} from '@fortawesome/free-solid-svg-icons';
import { faDocker } from '@fortawesome/free-brands-svg-icons';
import {
  Stack,
  Group,
  Text,
  Title,
  Card,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Switch,
  ActionIcon,
  Badge,
  Alert,
  Divider,
  MultiSelect,
  Paper,
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import getSchedule from '@/api/server/schedules/getSchedule';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps';
import createScheduleStep from '@/api/server/schedules/steps/createScheduleStep';
import updateScheduleStep from '@/api/server/schedules/steps/updateScheduleStep';
import deleteScheduleStep from '@/api/server/schedules/steps/deleteScheduleStep';

interface StepFormData {
  action: ScheduleAction;
  order: number;
}

const ACTION_TYPES = [
  { value: 'sleep', label: 'Sleep', icon: faHourglass, color: 'gray' },
  { value: 'send_power', label: 'Send Power Signal', icon: faPowerOff, color: 'red' },
  { value: 'send_command', label: 'Send Command', icon: faTerminal, color: 'blue' },
  { value: 'create_backup', label: 'Create Backup', icon: faDatabase, color: 'green' },
  { value: 'create_directory', label: 'Create Directory', icon: faFolder, color: 'yellow' },
  { value: 'write_file', label: 'Write File', icon: faFile, color: 'purple' },
  { value: 'copy_file', label: 'Copy File', icon: faCopy, color: 'cyan' },
  { value: 'delete_files', label: 'Delete Files', icon: faTrash, color: 'red' },
  { value: 'rename_files', label: 'Rename Files', icon: faEdit, color: 'orange' },
  { value: 'compress_files', label: 'Compress Files', icon: faCompress, color: 'teal' },
  { value: 'decompress_file', label: 'Decompress File', icon: faExpand, color: 'lime' },
  { value: 'update_startup_variable', label: 'Update Startup Variable', icon: faGear, color: 'indigo' },
  { value: 'update_startup_command', label: 'Update Startup Command', icon: faCode, color: 'violet' },
  { value: 'update_startup_docker_image', label: 'Update Docker Image', icon: faDocker, color: 'blue' },
];

const POWER_ACTIONS = ['start', 'stop', 'restart', 'kill'];
const ARCHIVE_FORMATS = ['tar', 'tar.gz', 'zip'];

function StepCard({
  step,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  step: ScheduleStep;
  onEdit: (step: ScheduleStep) => void;
  onDelete: (stepUuid: string) => void;
  onMoveUp: (step: ScheduleStep) => void;
  onMoveDown: (step: ScheduleStep) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const actionType = ACTION_TYPES.find((type) => type.value === step.action.type);

  const renderActionSummary = () => {
    const action = step.action;
    switch (action.type) {
      case 'sleep':
        return `Sleep for ${action.duration}ms`;
      case 'send_power':
        return `Power: ${action.action}`;
      case 'send_command':
        return `Command: ${action.command.substring(0, 30)}...`;
      case 'create_backup':
        return `Backup: ${action.name || 'Auto-generated'}`;
      case 'write_file':
        return `Write to: ${action.file}`;
      case 'copy_file':
        return `Copy: ${action.file} → ${action.destination}`;
      default:
        return action.type.replace(/_/g, ' ');
    }
  };

  return (
    <Card withBorder p={'md'} shadow={'sm'}>
      <Group justify={'space-between'} align={'flex-start'}>
        <Group gap={'md'} align={'flex-start'}>
          <ThemeIcon size={'lg'} color={actionType?.color || 'gray'}>
            <FontAwesomeIcon icon={actionType?.icon || faGear} />
          </ThemeIcon>
          <Stack gap={4}>
            <Group gap={'sm'}>
              <Badge variant={'light'} size={'sm'}>
                Step {step.order}
              </Badge>
              <Text fw={600}>{actionType?.label || step.action.type}</Text>
            </Group>
            <Text size={'sm'} c={'dimmed'}>
              {renderActionSummary()}
            </Text>
            {step.error && (
              <Alert color={'red'} p={'xs'}>
                Error: {step.error}
              </Alert>
            )}
          </Stack>
        </Group>

        <Group gap={'xs'}>
          <ActionIcon variant={'subtle'} color={'gray'} disabled={!canMoveUp} onClick={() => onMoveUp(step)}>
            <FontAwesomeIcon icon={faArrowUp} />
          </ActionIcon>
          <ActionIcon variant={'subtle'} color={'gray'} disabled={!canMoveDown} onClick={() => onMoveDown(step)}>
            <FontAwesomeIcon icon={faArrowDown} />
          </ActionIcon>
          <ActionIcon variant={'subtle'} color={'blue'} onClick={() => onEdit(step)}>
            <FontAwesomeIcon icon={faEdit} />
          </ActionIcon>
          <ActionIcon variant={'subtle'} color={'red'} onClick={() => onDelete(step.uuid)}>
            <FontAwesomeIcon icon={faTrash} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}

function StepModal({
  opened,
  onClose,
  step,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  step: ScheduleStep | null;
  onSave: (data: StepFormData) => void;
}) {
  const [selectedActionType, setSelectedActionType] = useState<string>('sleep');

  const form = useForm<any>({
    initialValues: {
      order: 1,
      actionType: 'sleep',
      // Sleep
      duration: 1000,
      // Power/Command
      ignoreFailure: false,
      action: 'start',
      command: '',
      // Backup
      foreground: false,
      name: '',
      ignoredFiles: [],
      // File operations
      root: '/',
      file: '',
      destination: '',
      content: '',
      files: [],
      format: 'tar.gz',
      // Startup
      envVariable: '',
      value: '',
      image: '',
    },
  });

  useEffect(() => {
    if (step) {
      setSelectedActionType(step.action.type);
      form.setValues({
        order: step.order,
        actionType: step.action.type,
        ...step.action,
      });
    } else {
      form.reset();
      setSelectedActionType('sleep');
    }
  }, [step, opened]);

  const handleSubmit = (values: any) => {
    const { actionType, order, ...actionData } = values;

    const action: ScheduleAction = {
      type: actionType as any,
      ...actionData,
    };

    onSave({ action, order });
    onClose();
  };

  const renderActionFields = () => {
    switch (selectedActionType) {
      case 'sleep':
        return (
          <NumberInput
            label={'Duration (milliseconds)'}
            placeholder={'1000'}
            min={1}
            {...form.getInputProps('duration')}
          />
        );

      case 'send_power':
        return (
          <Stack>
            <Select label={'Power Action'} data={POWER_ACTIONS} {...form.getInputProps('action')} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'send_command':
        return (
          <Stack>
            <Textarea label={'Command'} placeholder={'say Hello World'} {...form.getInputProps('command')} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'create_backup':
        return (
          <Stack>
            <TextInput
              label={'Backup Name (optional)'}
              placeholder={'Auto-generated if empty'}
              {...form.getInputProps('name')}
            />
            <Switch label={'Run in Foreground'} {...form.getInputProps('foreground', { type: 'checkbox' })} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
            <MultiSelect
              label={'Ignored Files'}
              placeholder={'Add files to ignore'}
              data={[]}
              searchable
              // creatable
              // getCreateLabel={(query) => `+ Add "${query}"`}
              // onCreate={(query) => {
              //   const item = { value: query, label: query };
              //   return item;
              // }}
              {...form.getInputProps('ignoredFiles')}
            />
          </Stack>
        );

      case 'create_directory':
        return (
          <Stack>
            <TextInput label={'Root Path'} placeholder={'/home/container'} {...form.getInputProps('root')} />
            <TextInput label={'Directory Name'} placeholder={'new_folder'} {...form.getInputProps('name')} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'write_file':
        return (
          <Stack>
            <TextInput label={'File Path'} placeholder={'/home/container/file.txt'} {...form.getInputProps('file')} />
            <Textarea
              label={'Content'}
              placeholder={'File content here...'}
              autosize
              minRows={3}
              {...form.getInputProps('content')}
            />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'copy_file':
        return (
          <Stack>
            <TextInput
              label={'Source File'}
              placeholder={'/home/container/source.txt'}
              {...form.getInputProps('file')}
            />
            <TextInput
              label={'Destination'}
              placeholder={'/home/container/backup/source.txt'}
              {...form.getInputProps('destination')}
            />
            <Switch label={'Run in Foreground'} {...form.getInputProps('foreground', { type: 'checkbox' })} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'delete_files':
        return (
          <Stack>
            <TextInput label={'Root Path'} placeholder={'/home/container'} {...form.getInputProps('root')} />
            <MultiSelect
              label={'Files to Delete'}
              placeholder={'Add files to delete'}
              data={[]}
              searchable
              // creatable
              // getCreateLabel={(query) => `+ Add "${query}"`}
              // onCreate={(query) => {
              //   const item = { value: query, label: query };
              //   return item;
              // }}
              {...form.getInputProps('files')}
            />
          </Stack>
        );

      case 'compress_files':
        return (
          <Stack>
            <TextInput label={'Root Path'} placeholder={'/home/container'} {...form.getInputProps('root')} />
            <MultiSelect
              label={'Files to Compress'}
              placeholder={'Add files to compress'}
              data={[]}
              searchable
              // creatable
              // getCreateLabel={(query) => `+ Add "${query}"`}
              // onCreate={(query) => {
              //   const item = { value: query, label: query };
              //   return item;
              // }}
              {...form.getInputProps('files')}
            />
            <Select label={'Archive Format'} data={ARCHIVE_FORMATS} {...form.getInputProps('format')} />
            <TextInput label={'Archive Name'} placeholder={'backup.tar.gz'} {...form.getInputProps('name')} />
            <Switch label={'Run in Foreground'} {...form.getInputProps('foreground', { type: 'checkbox' })} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'update_startup_variable':
        return (
          <Stack>
            <TextInput
              label={'Environment Variable'}
              placeholder={'JAVA_OPTS'}
              {...form.getInputProps('envVariable')}
            />
            <TextInput label={'Value'} placeholder={'-Xmx2G -Xms1G'} {...form.getInputProps('value')} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'update_startup_command':
        return (
          <Stack>
            <Textarea
              label={'Startup Command'}
              placeholder={'java -jar server.jar'}
              {...form.getInputProps('command')}
            />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      case 'update_startup_docker_image':
        return (
          <Stack>
            <TextInput label={'Docker Image'} placeholder={'openjdk:17-alpine'} {...form.getInputProps('image')} />
            <Switch label={'Ignore Failure'} {...form.getInputProps('ignoreFailure', { type: 'checkbox' })} />
          </Stack>
        );

      default:
        return <Text c={'dimmed'}>Select an action type to configure</Text>;
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={step ? 'Edit Schedule Step' : 'Create Schedule Step'} size={'lg'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={'md'}>
          <NumberInput label={'Step Order'} placeholder={'1'} min={1} {...form.getInputProps('order')} />

          <Select
            label={'Action Type'}
            data={ACTION_TYPES.map((type) => ({ value: type.value, label: type.label }))}
            value={selectedActionType}
            onChange={(value) => {
              setSelectedActionType(value || 'sleep');
              form.setFieldValue('actionType', value);
            }}
          />

          <Divider />

          {renderActionFields()}

          <Group justify={'flex-end'} mt={'md'}>
            <Button variant={'outline'} onClick={onClose}>
              Cancel
            </Button>
            <Button leftSection={<FontAwesomeIcon icon={faSave} />}>{step ? 'Update Step' : 'Create Step'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export default () => {
  const params = useParams<'id'>();
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);

  const [schedule, setSchedule] = useState<ServerSchedule | null>(null);
  const [steps, setSteps] = useState<ScheduleStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<ScheduleStep | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure();

  const loadData = async () => {
    try {
      setLoading(true);
      if (params.id) {
        const [scheduleData, stepsData] = await Promise.all([
          getSchedule(server.uuid, params.id),
          getScheduleSteps(server.uuid, params.id, 1),
        ]);
        setSchedule(scheduleData);
        setSteps(stepsData.data);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load schedule data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleCreateStep = () => {
    setSelectedStep(null);
    openModal();
  };

  const handleEditStep = (step: ScheduleStep) => {
    setSelectedStep(step);
    openModal();
  };

  const handleSaveStep = async (data: StepFormData) => {
    try {
      if (selectedStep) {
        await updateScheduleStep(server.uuid, params.id!, selectedStep.uuid, data);
        notifications.show({
          title: 'Success',
          message: 'Step updated successfully',
          color: 'green',
        });
      } else {
        await createScheduleStep(server.uuid, params.id!, data);
        notifications.show({
          title: 'Success',
          message: 'Step created successfully',
          color: 'green',
        });
      }
      await loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save step',
        color: 'red',
      });
    }
  };

  const handleDeleteStep = async (stepUuid: string) => {
    try {
      await deleteScheduleStep(server.uuid, params.id!, stepUuid);
      notifications.show({
        title: 'Success',
        message: 'Step deleted successfully',
        color: 'green',
      });
      await loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete step',
        color: 'red',
      });
    }
  };

  const handleMoveStep = async (step: ScheduleStep, direction: 'up' | 'down') => {
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex((s) => s.uuid === step.uuid);

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedSteps.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetStep = sortedSteps[targetIndex];

    try {
      await Promise.all([
        updateScheduleStep(server.uuid, params.id!, step.uuid, {
          action: step.action,
          order: targetStep.order,
        }),
        updateScheduleStep(server.uuid, params.id!, targetStep.uuid, {
          action: targetStep.action,
          order: step.order,
        }),
      ]);

      notifications.show({
        title: 'Success',
        message: 'Steps reordered successfully',
        color: 'green',
      });

      await loadData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reorder steps',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <div className={'w-full'}>
        <Spinner.Centered />
      </div>
    );
  }

  if (!schedule) {
    return (
      <Alert color={'red'} title={'Error'}>
        Schedule not found
      </Alert>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <Stack gap={'lg'}>
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
          <Button onClick={handleCreateStep} leftSection={<FontAwesomeIcon icon={faPlus} />}>
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
          <Button onClick={handleCreateStep} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create First Step
          </Button>
        </Paper>
      ) : (
        <Stack gap={'md'}>
          {sortedSteps.map((step, index) => (
            <StepCard
              key={step.uuid}
              step={step}
              onEdit={handleEditStep}
              onDelete={handleDeleteStep}
              onMoveUp={(step) => handleMoveStep(step, 'up')}
              onMoveDown={(step) => handleMoveStep(step, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < sortedSteps.length - 1}
            />
          ))}
        </Stack>
      )}

      <StepModal opened={modalOpened} onClose={closeModal} step={selectedStep} onSave={handleSaveStep} />
    </Stack>
  );
};
