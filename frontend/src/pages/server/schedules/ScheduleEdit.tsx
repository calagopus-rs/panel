import Spinner from '@/elements/Spinner';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import getSchedule from '@/api/server/schedules/getSchedule';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack, Switch, Text, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import ScheduleConditionBuilder from './ScheduleConditionBuilder';
import { serverPowerStateLabelMapping } from '@/lib/enums';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { load } from '@/lib/debounce';
import updateSchedule from '@/api/server/schedules/updateSchedule';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [schedule, setSchedule] = useState<ServerSchedule>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSchedule(server.uuid, params.id).then(setSchedule);
  }, [params.id]);

  const doUpdate = () => {
    load(true, setLoading);

    updateSchedule(server.uuid, schedule.uuid, schedule)
      .then(() => {
        addToast('Schedule created.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return !schedule ? (
    <div className={'w-full'}>
      <Spinner.Centered />
    </div>
  ) : (
    <>
      <Title order={1} c={'white'}>
        {schedule.name}
      </Title>

      <Stack>
        <TextInput
          label={'Schedule Name'}
          placeholder={'Schedule Name'}
          value={schedule.name}
          onChange={(e) => setSchedule((schedule) => ({ ...schedule, name: e.target.value }))}
        />

        <Switch
          label={'Enabled'}
          name={'enabled'}
          checked={schedule.enabled}
          onChange={(e) => setSchedule((schedule) => ({ ...schedule, enabled: e.target.checked }))}
        />

        <div>
          <Text mb={'sm'}>Triggers</Text>
          {schedule.triggers.map((trigger, index) => (
            <Group key={index} grow mb={'sm'}>
              <Select
                label={`Trigger ${index + 1}`}
                placeholder={`Trigger ${index + 1}`}
                value={trigger.type}
                onChange={(value) => {
                  switch (value) {
                    case 'cron':
                      setSchedule((schedule) => ({
                        ...schedule,
                        triggers: [
                          ...schedule.triggers.slice(0, index),
                          { type: 'cron', schedule: '' } as ScheduleTriggerCron,
                          ...schedule.triggers.slice(index + 1),
                        ],
                      }));
                      break;
                    case 'power_action':
                      setSchedule((schedule) => ({
                        ...schedule,
                        triggers: [
                          ...schedule.triggers.slice(0, index),
                          { type: 'power_action', action: 'start' } as ScheduleTriggerPowerAction,
                          ...schedule.triggers.slice(index + 1),
                        ],
                      }));
                      break;
                    case 'server_state':
                      setSchedule((schedule) => ({
                        ...schedule,
                        triggers: [
                          ...schedule.triggers.slice(0, index),
                          { type: 'server_state', state: null } as ScheduleTriggerServerState,
                          ...schedule.triggers.slice(index + 1),
                        ],
                      }));
                      break;
                    case 'crash':
                      setSchedule((schedule) => ({
                        ...schedule,
                        triggers: [
                          ...schedule.triggers.slice(0, index),
                          { type: 'crash', delay: 0 } as ScheduleTriggerCrash,
                          ...schedule.triggers.slice(index + 1),
                        ],
                      }));
                      break;
                    default:
                      throw new Error(`Unknown trigger type: ${value}`);
                  }
                }}
                data={[
                  { value: 'cron', label: 'Cron' },
                  { value: 'power_action', label: 'Power Action' },
                  { value: 'server_state', label: 'Server State' },
                  { value: 'crash', label: 'Crash' },
                ]}
              />

              {trigger.type === 'cron' ? (
                <TextInput
                  label={'Cron Schedule'}
                  placeholder={'Cron Schedule'}
                  value={trigger.schedule}
                  onChange={(e) => {
                    setSchedule((schedule) => ({
                      ...schedule,
                      triggers: [
                        ...schedule.triggers.slice(0, index),
                        { type: 'cron', schedule: e.target.value } as ScheduleTriggerCron,
                        ...schedule.triggers.slice(index + 1),
                      ],
                    }));
                  }}
                />
              ) : trigger.type === 'power_action' ? (
                <Select
                  label={'Power Action'}
                  placeholder={'Power Action'}
                  value={trigger.action}
                  onChange={(value) => {
                    setSchedule((schedule) => ({
                      ...schedule,
                      triggers: [
                        ...schedule.triggers.slice(0, index),
                        { type: 'power_action', action: value } as ScheduleTriggerPowerAction,
                        ...schedule.triggers.slice(index + 1),
                      ],
                    }));
                  }}
                  data={[
                    { value: 'start', label: 'Start' },
                    { value: 'stop', label: 'Stop' },
                    { value: 'restart', label: 'Restart' },
                    { value: 'kill', label: 'Kill' },
                  ]}
                />
              ) : trigger.type === 'server_state' ? (
                <Select
                  label={'Server State'}
                  placeholder={'Server State'}
                  value={trigger.state}
                  onChange={(value) => {
                    setSchedule((schedule) => ({
                      ...schedule,
                      triggers: [
                        ...schedule.triggers.slice(0, index),
                        { type: 'server_state', state: value } as ScheduleTriggerServerState,
                        ...schedule.triggers.slice(index + 1),
                      ],
                    }));
                  }}
                  data={Object.entries(serverPowerStateLabelMapping).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              ) : null}
            </Group>
          ))}
          <Button
            onClick={() =>
              setSchedule((schedule) => ({
                ...schedule,
                triggers: [...schedule.triggers, { type: 'cron', schedule: '' } as ScheduleTriggerCron],
              }))
            }
            variant={'light'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Add Trigger
          </Button>
          <Button
            className={'ml-2'}
            onClick={() =>
              setSchedule((schedule) => ({
                ...schedule,
                triggers: [...schedule.triggers.slice(0, -1)],
              }))
            }
            color={'red'}
            variant={'light'}
            leftSection={<FontAwesomeIcon icon={faMinus} />}
          >
            Remove Trigger
          </Button>
        </div>

        <div>
          <Text mb={'sm'}>Conditions</Text>
          <ScheduleConditionBuilder
            condition={schedule.condition}
            onChange={(condition) => setSchedule((schedule) => ({ ...schedule, condition }))}
          />
        </div>

        <Group>
          <Button onClick={doUpdate} loading={loading} disabled={!schedule.name}>
            Update
          </Button>
        </Group>
      </Stack>
    </>
  );
};
