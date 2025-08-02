import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';
import SettingsReinstallDialog from './dialogs/SettingsReinstallDialog';
import reinstallServer from '@/api/server/settings/reinstallServer';
import { useNavigate } from 'react-router';

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleReinstall = (truncateDirectory: boolean) => {
    reinstallServer(server.uuid, { truncateDirectory })
      .then(() => {
        addToast('Reinstalling server...', 'success');

        navigate(`/server/${server.uuidShort}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <SettingsReinstallDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onReinstall={handleReinstall} />

      <h1 className={'text-4xl font-bold text-white'}>Reinstall Server</h1>

      <div className={'mt-4 flex justify-end'}>
        <Button style={Button.Styles.Red} onClick={() => setDialogOpen(true)}>
          Reinstall Server
        </Button>
      </div>
    </div>
  );
};
