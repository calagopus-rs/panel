import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import { httpErrorToHuman } from '@/api/axios';
import updateServerSettings from '@/api/admin/settings/updateServerSettings';
import AdminSettingContainer from '@/elements/AdminSettingContainer';

export default () => {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [serverSettings, setServerSettings] = useState<AdminSettings['server']>(server);

  const handleUpdate = () => {
    updateServerSettings(serverSettings)
      .then(() => {
        addToast('Server settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <AdminSettingContainer title={'Server Settings'}>
      <div className={'mt-4'}>
        <Input.Label htmlFor={'max-file-manager-view-size'}>Max File Manager View Size</Input.Label>
        <Input.Text
          id={'max-file-manager-view-size'}
          placeholder={'Max File Manager View Size'}
          type={'number'}
          value={serverSettings.maxFileManagerViewSize}
          onChange={(e) => setServerSettings({ ...serverSettings, maxFileManagerViewSize: Number(e.target.value) })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          label={'Allow Overwriting Custom Docker Image'}
          name={'allow-overwriting-custom-docker-image'}
          defaultChecked={serverSettings.allowOverwritingCustomDockerImage}
          onChange={(e) =>
            setServerSettings({ ...serverSettings, allowOverwritingCustomDockerImage: e.target.checked })
          }
        />
      </div>

      <div className={'mt-4'}>
        <Input.Switch
          label={'Allow Editing Startup Command'}
          name={'allow-editing-startup-command'}
          defaultChecked={serverSettings.allowEditingStartupCommand}
          onChange={(e) => setServerSettings({ ...serverSettings, allowEditingStartupCommand: e.target.checked })}
        />
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button onClick={handleUpdate}>Update Server Settings</Button>
      </div>
    </AdminSettingContainer>
  );
};
