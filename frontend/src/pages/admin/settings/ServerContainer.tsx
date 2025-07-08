import { Button } from '@/elements/button';
import { useToast } from '@/providers/ToastProvider';
import { SettingContainer } from './AdminSettings';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import { Input } from '@/elements/inputs';
import { httpErrorToHuman } from '@/api/axios';
import updateServerSettings from '@/api/admin/settings/updateServerSettings';

export default () => {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [maxFileManagerViewSize, setMaxFileManagerViewSize] = useState(server.maxFileManagerViewSize);
  const [allowOverwritingCustomDockerImage, setAllowOverwritingCustomDockerImage] = useState(
    server.allowOverwritingCustomDockerImage,
  );
  const [allowEditingStartupCommand, setAllowEditingStartupCommand] = useState(server.allowEditingStartupCommand);

  const handleUpdate = () => {
    updateServerSettings({ maxFileManagerViewSize, allowOverwritingCustomDockerImage, allowEditingStartupCommand })
      .then(() => {
        addToast('Server settings updated.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <SettingContainer title="Server Settings">
      <div className="mt-4">
        <Input.Label htmlFor="max-file-manager-view-size">Max File Manager View Size</Input.Label>
        <Input.Text
          id="max-file-manager-view-size"
          placeholder="Max File Manager View Size"
          type="number"
          value={maxFileManagerViewSize}
          onChange={e => setMaxFileManagerViewSize(Number(e.target.value))}
        />
      </div>

      <div className="mt-4">
        <Input.Switch
          description="Allow Overwriting Custom Docker Image"
          name="allow-overwriting-custom-docker-image"
          defaultChecked={allowOverwritingCustomDockerImage}
          onChange={e => setAllowOverwritingCustomDockerImage(e.target.checked)}
        />
      </div>

      <div className="mt-4">
        <Input.Switch
          description="Allow Editing Startup Command"
          name="allow-editing-startup-command"
          defaultChecked={allowEditingStartupCommand}
          onChange={e => setAllowEditingStartupCommand(e.target.checked)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleUpdate}>Update Application Settings</Button>
      </div>
    </SettingContainer>
  );
};
