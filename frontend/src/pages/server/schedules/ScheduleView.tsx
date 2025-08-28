import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';
import runSchedule from '@/api/server/schedules/triggerSchedule';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClockRotateLeft,
  faPencil,
  faPlay,
  faClock,
  faBolt,
  faServer,
  faSkull,
  faMemory,
  faHdd,
  faExclamationTriangle,
  faMicrochip,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { formatDateTime, formatMiliseconds, formatTimestamp } from '@/lib/time';
import getScheduleSteps from '@/api/server/schedules/steps/getScheduleSteps';
import { Group, Stack, Text, Title, Timeline, Tabs, Alert, Grid, ThemeIcon } from '@mantine/core';
import {
  scheduleComparatorLabelMapping,
  scheduleComparatorOperatorMapping,
  scheduleStepIconMapping,
} from '@/lib/enums';
import { bytesToString } from '@/lib/size';
import Tooltip from '@/elements/Tooltip';
import Card from '@/elements/Card';
import Badge from '@/elements/Badge';
import Code from '@/elements/Code';

interface DetailCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

function DetailCard({ icon, label, value, subtext, color = 'blue' }: DetailCardProps) {
  return (
    <Card shadow={'sm'} padding={'lg'} radius={'md'} withBorder>
      <Group align={'flex-start'} gap={'md'}>
        <ThemeIcon size={'xl'} radius={'md'} color={color}>
          {icon}
        </ThemeIcon>
        <Stack gap={2}>
          <Text size={'sm'} c={'dimmed'} fw={500}>
            {label}
          </Text>
          <Text size={'lg'} fw={700}>
            {value}
            {subtext && (
              <Text component={'span'} size={'sm'} c={'dimmed'} ml={'xs'}>
                ({subtext})
              </Text>
            )}
          </Text>
        </Stack>
      </Group>
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
      case 'crash':
        return 'Server Crash';
      default:
        return 'Unknown Trigger';
    }
  };

  return (
    <Card withBorder>
      <Group>
        <ThemeIcon color={getTriggerColor(trigger.type)}>
          <FontAwesomeIcon icon={getTriggerIcon(trigger.type)} />
        </ThemeIcon>
        <Text fw={500}>{getTriggerLabel()}</Text>
      </Group>
    </Card>
  );
}

function ConditionRenderer({ condition }: { condition: ScheduleCondition }) {
  const renderCondition = (cond: ScheduleCondition, depth = 0): React.ReactNode => {
    switch (cond.type) {
      case 'and':
        return (
          <Stack gap={'xs'} pl={depth * 16}>
            <Badge color={'blue'} variant={'light'}>
              AND
            </Badge>
            {cond.conditions.map((c, i) => (
              <div key={i}>{renderCondition(c, depth + 1)}</div>
            ))}
          </Stack>
        );
      case 'or':
        return (
          <Stack gap={'xs'} pl={depth * 16}>
            <Badge color={'orange'} variant={'light'}>
              OR
            </Badge>
            {cond.conditions.map((c, i) => (
              <div key={i}>{renderCondition(c, depth + 1)}</div>
            ))}
          </Stack>
        );
      case 'server_state':
        return (
          <Card withBorder ml={depth * 16}>
            <Group>
              <FontAwesomeIcon icon={faServer} />
              <Text>Server State: {cond.state}</Text>
            </Group>
          </Card>
        );
      case 'uptime':
        return (
          <Card withBorder ml={depth * 16}>
            <Group>
              <FontAwesomeIcon icon={faClock} />
              <Text>
                Uptime&nbsp;
                <Tooltip label={scheduleComparatorOperatorMapping[cond.comparator]}>
                  <Text component={'span'} c={'dimmed'}>
                    {scheduleComparatorLabelMapping[cond.comparator]}
                  </Text>
                </Tooltip>
                &nbsp;
                {formatMiliseconds(cond.value)}
              </Text>
            </Group>
          </Card>
        );
      case 'cpu_usage':
        return (
          <Card withBorder ml={depth * 16}>
            <Group>
              <FontAwesomeIcon icon={faMicrochip} />
              <Text>
                CPU Usage&nbsp;
                <Tooltip label={scheduleComparatorOperatorMapping[cond.comparator]}>
                  <Text component={'span'} c={'dimmed'}>
                    {scheduleComparatorLabelMapping[cond.comparator]}
                  </Text>
                </Tooltip>
                &nbsp;{cond.value}%
              </Text>
            </Group>
          </Card>
        );
      case 'memory_usage':
        return (
          <Card withBorder ml={depth * 16}>
            <Group>
              <FontAwesomeIcon icon={faMemory} />
              <Text>
                Memory Usage&nbsp;
                <Tooltip label={scheduleComparatorOperatorMapping[cond.comparator]}>
                  <Text component={'span'} c={'dimmed'}>
                    {scheduleComparatorLabelMapping[cond.comparator]}
                  </Text>
                </Tooltip>
                &nbsp;{bytesToString(cond.value)}
              </Text>
            </Group>
          </Card>
        );
      case 'disk_usage':
        return (
          <Card withBorder ml={depth * 16}>
            <Group>
              <FontAwesomeIcon icon={faHdd} />
              <Text>
                Disk Usage&nbsp;
                <Tooltip label={scheduleComparatorOperatorMapping[cond.comparator]}>
                  <Text component={'span'} c={'dimmed'}>
                    {scheduleComparatorLabelMapping[cond.comparator]}
                  </Text>
                </Tooltip>
                &nbsp;{bytesToString(cond.value)}
              </Text>
            </Group>
          </Card>
        );
      default:
        return null;
    }
  };

  return <>{renderCondition(condition)}</>;
}

function ActionStep({ step }: { step: ScheduleStep }) {
  const renderActionDetails = () => {
    const action = step.action;
    switch (action.type) {
      case 'sleep':
        return <Text size={'sm'}>Sleep for {action.duration}ms</Text>;
      case 'send_power':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>
              Power Action: <Code>{action.action}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'send_command':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>
              Command: <Code>{action.command}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'create_backup':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>Backup Name: {action.name || 'Auto-generated'}</Text>
            <Text size={'xs'} c={'dimmed'}>
              Foreground: {action.foreground ? 'Yes' : 'No'} | Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
            {action.ignoredFiles.length > 0 && (
              <Text size={'xs'} c={'dimmed'}>
                Ignored Files: {action.ignoredFiles.join(', ')}
              </Text>
            )}
          </Stack>
        );
      case 'write_file':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>
              File: <Code>{action.file}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Content: {action.content.substring(0, 50)}...
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Append: <Code>{action.append ? 'Yes' : 'No'}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'copy_file':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>
              From: <Code>{action.file}</Code>
            </Text>
            <Text size={'sm'}>
              To: <Code>{action.destination}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Foreground: {action.foreground ? 'Yes' : 'No'} | Ignore Failure: {action.ignoreFailure ? 'Yes' : 'No'}
            </Text>
          </Stack>
        );
      case 'delete_files':
        return (
          <Stack gap={'xs'}>
            <Text size={'sm'}>
              Root: <Code>{action.root}</Code>
            </Text>
            <Text size={'xs'} c={'dimmed'}>
              Files: {action.files.join(', ')}
            </Text>
          </Stack>
        );
      default:
        return (
          <Text size={'sm'} c={'dimmed'}>
            Action details not available
          </Text>
        );
    }
  };

  return (
    <Timeline.Item
      bullet={<FontAwesomeIcon icon={scheduleStepIconMapping[step.action.type]} size={'sm'} />}
      title={
        <Group gap={'sm'}>
          <Text fw={600}>
            Step {step.order}: {step.action.type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {step.error && (
            <Tooltip label={step.error}>
              <ThemeIcon size={'sm'} color={'red'}>
                <FontAwesomeIcon icon={faExclamationTriangle} size={'xs'} />
              </ThemeIcon>
            </Tooltip>
          )}
        </Group>
      }
    >
      <Card withBorder p={'sm'} mt={'xs'}>
        {renderActionDetails()}
      </Card>
    </Timeline.Item>
  );
}

export default () => {
  const params = useParams<'id'>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const server = useServerStore((state) => state.server);

  const [page, setPage] = useState(1);
  const [schedule, setSchedule] = useState<ServerSchedule | null>(null);
  const [steps, setSteps] = useState<ScheduleStep[]>([]);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString() });
  }, [page]);

  useEffect(() => {
    if (params.id) {
      getSchedule(server.uuid, params.id).then(setSchedule);
      getScheduleSteps(server.uuid, params.id).then(setSteps);
    }
  }, [params.id, page]);

  const doRunSchedule = () => {
    if (params.id) {
      runSchedule(server.uuid, params.id).then(() => {
        setSchedule((schedule) => (schedule ? { ...schedule, isProcessing: true } : null));
      });
    }
  };

  if (!schedule || !steps) {
    return (
      <div className={'w-full'}>
        <Spinner.Centered />
      </div>
    );
  }

  const sortedSteps = steps.sort((a, b) => a.order - b.order);

  return (
    <Stack gap={'lg'}>
      <Group justify={'space-between'}>
        <Group gap={'md'}>
          <Title order={1} c={'white'}>
            {schedule.name}
          </Title>
          <Badge color={schedule.enabled ? 'green' : 'red'} size={'lg'}>
            {schedule.enabled ? 'Active' : 'Inactive'}
          </Badge>
        </Group>

        <Group>
          {sortedSteps.length > 0 && (
            <Button
              disabled={!schedule.enabled}
              onClick={doRunSchedule}
              color={'green'}
              leftSection={<FontAwesomeIcon icon={faPlay} />}
            >
              Run Now
            </Button>
          )}
          <Button
            onClick={() => navigate(`/server/${server.uuidShort}/schedules/${schedule.uuid}/edit`)}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPencil} />}
          >
            Edit
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DetailCard
            icon={<FontAwesomeIcon icon={faClockRotateLeft} />}
            label={'Last Run'}
            value={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'Never'}
            subtext={schedule.lastRun ? formatTimestamp(schedule.lastRun).trim() : undefined}
            color={'blue'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DetailCard
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            label={'Last Failure'}
            value={schedule.lastFailure ? formatDateTime(schedule.lastFailure) : 'None'}
            subtext={schedule.lastFailure ? formatTimestamp(schedule.lastFailure).trim() : undefined}
            color={schedule.lastFailure ? 'red' : 'green'}
          />
        </Grid.Col>
      </Grid>

      <Tabs defaultValue={'actions'}>
        <Tabs.List>
          <Tabs.Tab value={'actions'}>Actions</Tabs.Tab>
          <Tabs.Tab value={'conditions'}>Conditions</Tabs.Tab>
          <Tabs.Tab value={'triggers'}>Triggers</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={'actions'} pt={'md'}>
          <Card withBorder p={'lg'}>
            <Group justify={'space-between'}>
              <Title order={3} mb={'md'}>
                Schedule Actions
              </Title>
              <Group>
                <Button
                  onClick={() => navigate(`/server/${server.uuidShort}/schedules/${schedule.uuid}/edit-steps`)}
                  variant={'outline'}
                >
                  Edit
                </Button>
              </Group>
            </Group>
            {sortedSteps.length === 0 ? (
              <Alert icon={<FontAwesomeIcon icon={faExclamationTriangle} />} color={'yellow'}>
                No actions configured for this schedule
              </Alert>
            ) : (
              <Timeline active={-1} bulletSize={40} lineWidth={2}>
                {sortedSteps.map((step) => (
                  <ActionStep key={step.uuid} step={step} />
                ))}
              </Timeline>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value={'conditions'} pt={'md'}>
          <Card withBorder p={'lg'}>
            <Title order={3} mb={'md'}>
              Execution Conditions
            </Title>
            {schedule.condition.type === 'none' ? (
              <Alert icon={<FontAwesomeIcon icon={faInfoCircle} />} color={'blue'}>
                This schedule does not have any conditions
              </Alert>
            ) : (
              <ConditionRenderer condition={schedule.condition} />
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value={'triggers'} pt={'md'}>
          <Card withBorder p={'lg'}>
            <Title order={3} mb={'md'}>
              Schedule Triggers
            </Title>
            {schedule.triggers.length === 0 ? (
              <Alert icon={<FontAwesomeIcon icon={faExclamationTriangle} />} color={'yellow'}>
                No triggers configured for this schedule
              </Alert>
            ) : (
              <Stack gap={'md'}>
                {schedule.triggers.map((trigger, index) => (
                  <TriggerCard key={index} trigger={trigger} />
                ))}
              </Stack>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
