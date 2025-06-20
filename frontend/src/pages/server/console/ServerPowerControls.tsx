import { PowerAction } from '@/api/types';
import { Button } from '@/elements/button';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';

export default function ServerPowerControls() {
  const [open, setOpen] = useState(false);
  const status = useServerStore(state => state.status.value);
  const instance = useServerStore(state => state.socket.instance);

  const killable = status === 'stopping';
  const onButtonClick = (
    action: PowerAction | 'kill-confirmed',
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ): void => {
    e.preventDefault();
    if (action === 'kill') {
      return setOpen(true);
    }

    if (instance) {
      setOpen(false);
      instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
    }
  };

  useEffect(() => {
    if (status === 'offline') {
      setOpen(false);
    }
  }, [status]);

  return (
    <div className="flex gap-2">
      <Button style={Button.Styles.Green} disabled={status !== 'offline'} onClick={onButtonClick.bind(this, 'start')}>
        Start
      </Button>
      <Button style={Button.Styles.Gray} disabled={!status} onClick={onButtonClick.bind(this, 'restart')}>
        Restart
      </Button>
      <Button
        style={Button.Styles.Red}
        disabled={status === 'offline'}
        onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
      >
        {killable ? 'Kill' : 'Stop'}
      </Button>
    </div>
  );
}
