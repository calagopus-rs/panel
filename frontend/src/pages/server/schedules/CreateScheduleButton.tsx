import { httpErrorToHuman } from '@/api/axios';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/elements/Toast';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default () => {
  const server = useServerStore(state => state.data);
  const { addSchedule } = useServerStore(state => state.schedules);
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);

  const [scheduleName, setScheduleName] = useState('');
  const [cronMinutes, setCronMinutes] = useState('*/5');
  const [cronHours, setCronHours] = useState('*');
  const [cronDayOfMonth, setCronDayOfMonth] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronDayOfWeek, setCronDayOfWeek] = useState('*');
  const [runOnline, setRunOnline] = useState(true);
  const [enabled, setEnabled] = useState(true);

  const submit = () => {
    createOrUpdateSchedule(server.id, {
      name: scheduleName,
      cron: { minute: cronMinutes, hour: cronHours, day: cronDayOfMonth, month: cronMonth, weekday: cronDayOfWeek },
      onlyWhenOnline: runOnline,
      isActive: enabled,
    })
      .then(schedule => {
        addSchedule(schedule);
        setOpen(false);
        addToast('Schedule created.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={'Create Schedule'} onClose={() => setOpen(false)} open={open}>
        <label htmlFor={'scheduleName'} className={'block mt-3 font-bold'}>
          Schedule Name
        </label>
        <Input.Text
          id={'scheduleName'}
          name={'scheduleName'}
          placeholder={'A descriptive name for your schedule.'}
          autoFocus
          onChange={e => setScheduleName(e.target.value)}
        />

        <div className={'grid grid-cols-2 gap-2 mt-2 p-2 border-2 border-gray-500 rounded'}>
          <label htmlFor={'cronMinutes'} className={'block mt-3 font-bold'}>
            Cron Minutes
          </label>
          <Input.Text
            id={'cronMinutes'}
            name={'cronMinutes'}
            placeholder={'*/5'}
            value={cronMinutes}
            onChange={e => setCronMinutes(e.target.value)}
          />

          <label htmlFor={'cronHours'} className={'block mt-3 font-bold'}>
            Cron Hours
          </label>
          <Input.Text
            id={'cronHours'}
            name={'cronHours'}
            placeholder={'*'}
            value={cronHours}
            onChange={e => setCronHours(e.target.value)}
          />

          <label htmlFor={'cronDayOfMonth'} className={'block mt-3 font-bold'}>
            Cron Day of Month
          </label>
          <Input.Text
            id={'cronDayOfMonth'}
            name={'cronDayOfMonth'}
            placeholder={'*'}
            value={cronDayOfMonth}
            onChange={e => setCronDayOfMonth(e.target.value)}
          />

          <label htmlFor={'cronMonth'} className={'block mt-3 font-bold'}>
            Cron Month
          </label>
          <Input.Text
            id={'cronMonth'}
            name={'cronMonth'}
            placeholder={'*'}
            value={cronMonth}
            onChange={e => setCronMonth(e.target.value)}
          />

          <label htmlFor={'cronDayOfWeek'} className={'block mt-3 font-bold'}>
            Cron Day of Week
          </label>
          <Input.Text
            id={'cronDayOfWeek'}
            name={'cronDayOfWeek'}
            placeholder={'*'}
            value={cronDayOfWeek}
            onChange={e => setCronDayOfWeek(e.target.value)}
          />
        </div>

        <label htmlFor={'runOnline'} className={'block mt-3 font-bold'}>
          Run Online
        </label>
        <Input.Switch
          description={'Only execute this schedule when the server is in a running state.'}
          name={'runOnline'}
          defaultChecked={runOnline}
          onChange={e => setRunOnline(e.target.checked)}
        />

        <label htmlFor={'enabled'} className={'block mt-3 font-bold'}>
          Enabled
        </label>
        <Input.Switch
          description={'Enable or disable this schedule.'}
          name={'enabled'}
          defaultChecked={enabled}
          onChange={e => setEnabled(e.target.checked)}
        />

        <Dialog.Footer>
          <Button style={Button.Styles.Green} onClick={submit}>
            Create
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>Create new</Button>
    </>
  );
};
