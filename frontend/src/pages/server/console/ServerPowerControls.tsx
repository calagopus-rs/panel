import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';

export default () => {
  const [open, setOpen] = useState(false);
  const state = useServerStore(state => state.state);
  const instance = useServerStore(state => state.socketInstance);

  const killable = state === 'stopping';
  const onButtonClick = (
    action: ServerPowerAction | 'kill-confirmed',
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
    if (state === 'offline') {
      setOpen(false);
    }
  }, [state]);

  return (
    <div className="flex gap-2">
      <Dialog.Confirm
        open={open}
        hideCloseIcon
        onClose={() => setOpen(false)}
        title="Forcibly Stop Process"
        confirm="Continue"
        onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
      >
        Forcibly stopping a server can lead to data corruption.
      </Dialog.Confirm>

      <Button style={Button.Styles.Green} disabled={state !== 'offline'} onClick={onButtonClick.bind(this, 'start')}>
        Start
      </Button>
      <Button style={Button.Styles.Gray} disabled={!state} onClick={onButtonClick.bind(this, 'restart')}>
        Restart
      </Button>
      <Button
        style={Button.Styles.Red}
        disabled={state === 'offline'}
        onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
      >
        {killable ? 'Kill' : 'Stop'}
      </Button>
    </div>
  );
};
