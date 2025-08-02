import { httpErrorToHuman } from '@/api/axios';
import updateTimezone from '@/api/server/settings/updateTimezone';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { zones } from 'tzdata';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [timezone, setTimezone] = useState(server.timezone || '');
  const [time, setTime] = useState('');

  const handleUpdate = () => {
    updateTimezone(server.uuid, { timezone })
      .then(() => {
        addToast('Server timezone updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  useEffect(() => {
    if (timezone) {
      const interval = setInterval(() => {
        setTime(new Date().toLocaleString('en-US', { timeZone: timezone }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timezone]);

  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <h1 className={'text-4xl font-bold text-white'}>Update Timezone</h1>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'timezone'}>Timezone</Input.Label>
        <Input.Dropdown
          id={'timezone'}
          options={timezones}
          selected={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <p className={'text-gray-400 text-sm mt-1'}>{time}</p>
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button disabled={!timezone} onClick={handleUpdate}>
          Update Timezone
        </Button>
      </div>
    </div>
  );
};
