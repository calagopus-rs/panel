import { useEffect, useState } from 'react';
import Button from '@/elements/Button';
import Can from '@/elements/Can';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useServerStore } from '@/stores/server';

export default function ServerPowerControls() {
  const [open, setOpen] = useState(false);
  const state = useServerStore((state) => state.state);
  const instance = useServerStore((state) => state.socketInstance);

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
    <div className={'flex gap-2'}>
      <ConfirmationModal
        opened={open}
        onClose={() => setOpen(false)}
        title={'Forcibly Stop Process'}
        confirm={'Continue'}
        onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
      >
        Forcibly stopping a server can lead to data corruption.
      </ConfirmationModal>

      <Can action={'control.start'}>
        <Button
          color={'green'}
          disabled={state !== 'offline'}
          loading={state === 'starting'}
          onClick={onButtonClick.bind(this, 'start')}
        >
          Start
        </Button>
      </Can>
      <Can action={'control.restart'}>
        <Button color={'gray'} disabled={!state} onClick={onButtonClick.bind(this, 'restart')}>
          Restart
        </Button>
      </Can>
      <Can action={'control.stop'}>
        <Button
          color={'red'}
          disabled={state === 'offline'}
          onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
        >
          {killable ? 'Kill' : 'Stop'}
        </Button>
      </Can>
    </div>
  );
}
