import { httpErrorToHuman } from '@/api/axios';
import updateAutokill from '@/api/server/settings/updateAutokill';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [enabled, setEnabled] = useState(server.autoKill.enabled);
  const [seconds, setSeconds] = useState(server.autoKill.seconds);

  const handleUpdate = () => {
    updateAutokill(server.uuid, { enabled, seconds })
      .then(() => {
        addToast('Server auto-kill updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <h1 className={'text-4xl font-bold text-white'}>Update Auto-Kill</h1>

      <div className={'mt-4'}>
        <Input.Switch
          name={'enabled'}
          defaultChecked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          label={'Enabled'}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'seconds'}>Seconds</Input.Label>
        <Input.Text
          id={'seconds'}
          placeholder={'Seconds until auto-kill'}
          type={'number'}
          min={0}
          max={3600}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button onClick={handleUpdate}>Update Auto-Kill</Button>
      </div>
    </div>
  );
};
