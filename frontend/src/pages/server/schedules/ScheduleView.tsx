import {
  faArchive,
  faBolt,
  faChevronDown,
  faClock,
  faClockRotateLeft,
  faExclamationTriangle,
  faPencil,
  faPlay,
  faPlayCircle,
  faReply,
  faServer,
  faSkull,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Group, Stack, Tabs, Text, ThemeIcon, Timeline, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule.ts';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps.ts';
import triggerSchedule from '@/api/server/schedules/triggerSchedule.ts';
import updateSchedule from '@/api/server/schedules/updateSchedule.ts';
import AnimatedHourglass from '@/elements/AnimatedHourglass.tsx';
import Badge from '@/elements/Badge.tsx';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import Code from '@/elements/Code.tsx';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Spinner from '@/elements/Spinner.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { scheduleStepIconMapping } from '@/lib/enums.ts';
import { formatDateTime } from '@/lib/time.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import ScheduleCreateOrUpdateModal from './modals/ScheduleCreateOrUpdateModal.tsx';
import ScheduleDynamicParameterRenderer from './ScheduleDynamicParameterRenderer.tsx';
import SchedulePreConditionBuilder from './SchedulePreConditionBuilder.tsx';
import StepsEditor from './StepsEditor.tsx';

interface DetailCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  className?: string;
}

function DetailCard({ icon, label, value, color = 'blue' }: DetailCardProps) {
  return (
    <Card className='flex flex-row! items-center flex-1'>
      <ThemeIcon size='xl' radius='md' color={color}>
        {icon}
      </ThemeIcon>
      <div className='flex flex-col ml-4 w-full'>
        <div className='w-full flex justify-between'>
          <span className='text-sm text-gray-400 font-bold'>{label}</span>
        </div>
        <span className='text-lg font-bold'>{value}</span>
      </div>
    </Card>
  );
}

function TriggerCard({ trigger }: { trigger: ScheduleTrigger }) {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'cron':
        return faClock;
      case 'power_action':
        return faBolt;
      case 'server_state':
        return faServer;
      case 'backup_status':
        return faArchive;
      case 'console_line':
        return faTerminal;
      case 'crash':
        return faSkull;
      default:
        return faClock;
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'cron':
        return 'blue';
      case 'power_action':
        return 'orange';
      case 'server_state':
        return 'green';
      case 'backup_status':
        return 'green';
      case 'console_line':
        return 'gray';
      case 'crash':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTriggerLabel = () => {
    switch (trigger.type) {
      case 'cron':
        return `Cron: ${trigger.schedule}`;
      case 'power_action':
        return `Power Action: ${trigger.action}`;
      case 'server_state':
        return `Server State: ${trigger.state}`;
      case 'backup_status':
        return `Backup Status: ${trigger.status}`;
      case 'console_line':
        return `Console Line contains: ${trigger.contains}`;
      case 'crash':
        return 'Server Crash';
      default:
        return 'Unknown Trigger';
    }
  };

  return (
    <Card>
      <Group>
        <ThemeIcon color={getTriggerColor(trigger.type)}>
          <FontAwesomeIcon icon={getTriggerIcon(trigger.type)} />
        </ThemeIcon>
        <Text fw={500}>{getTriggerLabel()}</Text>
      </Group>
    </Card>
  );
}

function ActionStep({ step, scheduleStatus }: { step: ScheduleStep; scheduleStatus: ScheduleStatus }) {
  const getScheduleStepError = useServerStore((state) => state.getScheduleStepError);

  const renderActionDetails = () => {
    const action = step.action;
    switch (action.type) {
      case 'sleep':
        return <Text size='sm'>Sleep for {action.duration}ms</Text>;
      case 'ensure':
        return <Text size='sm'>Ensure a condition matches</Text>;
      case 'format':
        return (
          <Text size='sm'>
            Format a string into <ScheduleDynamicParameterRenderer value={action.outputInto} />
          </Text>
        );
      case 'match_regex':
        return (
          <Text size='sm'>
            Match <ScheduleDynamicParameterRenderer value={action.input} /> with regex <Code>{action.regex}</Code>
          </Text>
        );
      case 'wait_for_console_line':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              Line must contain: <ScheduleDynamicParameterRenderer value={action.contains} />
            </Text>
            <Text size='sm'>
              Timeout: <Code>{action.timeout}ms</Code>
            </Text>
            <Text size='xs' c='dimmed'>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'send_power':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              Power Action: <Code>{action.action}</Code>
            </Text>
            <Text size='xs' c='dimmed'>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'send_command':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              Command: <ScheduleDynamicParameterRenderer value={action.command} />
            </Text>
            <Text size='xs' c='dimmed'>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'create_backup':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              Backup Name: <ScheduleDynamicParameterRenderer value={action.name} />
            </Text>
            <Text size='xs' c='dimmed'>
              Foreground: {action.foreground ? 'Yes' : 'No'} | Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
            {action.ignoredFiles.length > 0 && (
              <Text size='xs' c='dimmed'>
                Ignored Files: {action.ignoredFiles.join(', ')}
              </Text>
            )}
          </Stack>
        );
      case 'write_file':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              File: <ScheduleDynamicParameterRenderer value={action.file} />
            </Text>
            <Text size='xs' c='dimmed'>
              Append: <Code>{action.append ? 'Yes' : 'No'}</Code>
            </Text>
            <Text size='xs' c='dimmed'>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'copy_file':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              From: <ScheduleDynamicParameterRenderer value={action.file} />
            </Text>
            <Text size='sm'>
              To: <ScheduleDynamicParameterRenderer value={action.destination} />
            </Text>
            <Text size='xs' c='dimmed'>
              Foreground: {action.foreground ? 'Yes' : 'No'} | Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'delete_files':
        return (
          <Stack gap='xs'>
            <Text size='sm'>
              Root: <ScheduleDynamicParameterRenderer value={action.root} />
            </Text>
            <Text size='xs' c='dimmed'>
              Files: {action.files.join(', ')}
            </Text>
          </Stack>
        );
      default:
        return (
          <Text size='sm' c='dimmed'>
            Action details not available
          </Text>
        );
    }
  };

  const stepError = getScheduleStepError(step);

  return (
    <Timeline.Item
      bullet={
        scheduleStatus.step === step.uuid ? (
          <AnimatedHourglass />
        ) : (
          <FontAwesomeIcon icon={scheduleStepIconMapping[step.action.type]} size='sm' />
        )
      }
      title={
        <Group gap='sm'>
          <Text fw={600}>
            Step {step.order}: {step.action.type.replace(/_/g, ' ').toUpperCase()}{' '}
          </Text>
          {scheduleStatus.step === step.uuid && <Badge ml='md'>Running</Badge>}
          {stepError && (
            <Tooltip label={stepError}>
              <ThemeIcon size='sm' color='red'>
                <FontAwesomeIcon icon={faExclamationTriangle} size='xs' />
              </ThemeIcon>
            </Tooltip>
          )}
        </Group>
      }
    >
      <Card p='sm' mt='xs'>
        {renderActionDetails()}
      </Card>
    </Timeline.Item>
  );
}

export default function ScheduleView() {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const { server, schedule, setSchedule, scheduleStatus, scheduleSteps, setScheduleSteps } = useServerStore();

  const [openModal, setOpenModal] = useState<'actions' | 'update' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      getSchedule(server.uuid, params.id).then(setSchedule);
      getScheduleSteps(server.uuid, params.id).then(setScheduleSteps);
    }
  }, [params.id]);

  const doTriggerSchedule = (skipCondition: boolean) => {
    if (params.id) {
      setLoading(true);

      triggerSchedule(server.uuid, params.id, skipCondition)
        .then(() => {
          addToast('Schedule triggered.', 'success');
        })
        .finally(() => setLoading(false));
    }
  };

  const doUpdate = () => {
    if (params.id) {
      setLoading(true);

      updateSchedule(server.uuid, params.id, { condition: schedule!.condition })
        .then(() => {
          addToast('Schedule updated.', 'success');
        })
        .finally(() => setLoading(false));
    }
  };

  if (!schedule || !scheduleSteps) {
    return (
      <div className='w-full'>
        <Spinner.Centered />
      </div>
    );
  }

  return (
    <ServerContentContainer title='Schedule' hideTitleComponent>
      <ScheduleCreateOrUpdateModal
        propSchedule={schedule}
        onScheduleUpdate={(s) => setSchedule({ ...schedule, ...s })}
        opened={openModal === 'update'}
        onClose={() => setOpenModal(null)}
      />

      <Stack gap='lg'>
        <Group justify='space-between'>
          <Group gap='md'>
            <Title order={1} c='white'>
              {schedule.name}
            </Title>
            <Badge color={schedule.enabled ? 'green' : 'red'} size='lg'>
              {schedule.enabled ? 'Active' : 'Inactive'}
            </Badge>
          </Group>

          <Group>
            {scheduleSteps.length > 0 && (
              <ContextMenuProvider>
                <ContextMenu
                  items={[
                    {
                      icon: faPlayCircle,
                      label: 'Trigger (do not skip condition)',
                      onClick: () => doTriggerSchedule(false),
                      color: 'gray',
                    },
                    {
                      icon: faPlay,
                      label: 'Trigger (skip condition)',
                      onClick: () => doTriggerSchedule(true),
                      color: 'gray',
                    },
                  ]}
                >
                  {({ openMenu }) =>
                    schedule.enabled ? (
                      <Button
                        loading={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          openMenu(rect.left, rect.bottom);
                        }}
                        color='green'
                        rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                      >
                        Trigger
                      </Button>
                    ) : (
                      <Tooltip label='Cannot Trigger disabled schedule'>
                        <Button
                          disabled
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            openMenu(rect.left, rect.bottom);
                          }}
                          color='green'
                          rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                        >
                          Trigger
                        </Button>
                      </Tooltip>
                    )
                  }
                </ContextMenu>
              </ContextMenuProvider>
            )}
            <Button
              onClick={() => setOpenModal('update')}
              color='blue'
              leftSection={<FontAwesomeIcon icon={faPencil} />}
            >
              Edit
            </Button>
          </Group>
        </Group>

        <div className='flex flex-row space-x-2'>
          <DetailCard
            icon={<FontAwesomeIcon icon={faClockRotateLeft} />}
            label='Last Run'
            value={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'Never'}
            color='blue'
          />
          <DetailCard
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            label='Last Failure'
            value={schedule.lastFailure ? formatDateTime(schedule.lastFailure) : 'None'}
            color={schedule.lastFailure ? 'red' : 'green'}
          />
        </div>

        <Tabs defaultValue='actions'>
          <Tabs.List>
            <Tabs.Tab value='actions'>Actions</Tabs.Tab>
            <Tabs.Tab value='conditions'>Conditions</Tabs.Tab>
            <Tabs.Tab value='triggers'>Triggers</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value='actions' pt='md'>
            <Card p='lg'>
              <Group justify='space-between'>
                <Title order={3} mb='md'>
                  Schedule Actions
                </Title>
                <Group>
                  <Button
                    onClick={() => setOpenModal(openModal === 'actions' ? null : 'actions')}
                    variant='outline'
                    leftSection={<FontAwesomeIcon icon={openModal === 'actions' ? faReply : faPencil} />}
                  >
                    {openModal === 'actions' ? 'Exit Editor' : 'Edit'}
                  </Button>
                </Group>
              </Group>
              {openModal === 'actions' ? (
                <StepsEditor schedule={schedule} />
              ) : scheduleSteps.length === 0 ? (
                <Alert icon={<FontAwesomeIcon icon={faExclamationTriangle} />} color='yellow'>
                  No actions configured for this schedule
                </Alert>
              ) : (
                <Timeline
                  active={
                    scheduleSteps.findIndex((step) => step.uuid === scheduleStatus.get(schedule.uuid)?.step) ?? -1
                  }
                  color='blue'
                  bulletSize={40}
                  lineWidth={2}
                >
                  {scheduleSteps.map((step) => (
                    <ActionStep
                      key={step.uuid}
                      step={step}
                      scheduleStatus={
                        scheduleStatus.get(schedule.uuid) ?? {
                          running: false,
                          step: null,
                        }
                      }
                    />
                  ))}
                </Timeline>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value='conditions' pt='md'>
            <Card p='lg'>
              <Title order={3} mb='md'>
                Execution Pre-Conditions
              </Title>
              <SchedulePreConditionBuilder
                condition={schedule.condition}
                onChange={(condition) => setSchedule({ ...schedule, condition })}
              />

              <div className='flex flex-row mt-6'>
                <Button loading={loading} onClick={doUpdate}>
                  Update
                </Button>
              </div>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value='triggers' pt='md'>
            <Card p='lg'>
              <Title order={3} mb='md'>
                Schedule Triggers
              </Title>
              {schedule.triggers.length === 0 ? (
                <Alert icon={<FontAwesomeIcon icon={faExclamationTriangle} />} color='yellow'>
                  No triggers configured for this schedule
                </Alert>
              ) : (
                <Stack gap='md'>
                  {schedule.triggers.map((trigger, index) => (
                    <TriggerCard key={index} trigger={trigger} />
                  ))}
                </Stack>
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </ServerContentContainer>
  );
}
