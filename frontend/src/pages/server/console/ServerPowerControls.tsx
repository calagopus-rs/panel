import { useEffect, useState } from 'react';
import Button from '@/elements/Button.tsx';
import Can from '@/elements/Can.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function ServerPowerControls() {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const state = useServerStore((state) => state.state);
  const instance = useServerStore((state) => state.socketInstance);

  const killable = state === 'stopping';

  const onButtonClick = (action: ServerPowerAction | 'kill-confirmed') => {
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
    <div className='flex gap-2'>
      <ConfirmationModal
        opened={open}
        onClose={() => setOpen(false)}
        title={t('pages.server.console.power.modal.forceStop.title', {})}
        confirm={t('common.button.continue', {})}
        onConfirmed={() => onButtonClick('kill-confirmed')}
      >
        {t('pages.server.console.power.modal.forceStop.content', {})}
      </ConfirmationModal>

      <Can action='control.start'>
        <Button
          color='green'
          disabled={state !== 'offline'}
          loading={state === 'starting'}
          onClick={() => onButtonClick('start')}
        >
          {t('pages.server.console.power.start', {})}
        </Button>
      </Can>
      <Can action='control.restart'>
        <Button color='gray' disabled={!state} onClick={() => onButtonClick('restart')}>
          {t('pages.server.console.power.restart', {})}
        </Button>
      </Can>
      <Can action='control.stop'>
        <Button color='red' disabled={state === 'offline'} onClick={() => onButtonClick(killable ? 'kill' : 'stop')}>
          {killable ? t('pages.server.console.power.kill', {}) : t('pages.server.console.power.stop', {})}
        </Button>
      </Can>
    </div>
  );
}
