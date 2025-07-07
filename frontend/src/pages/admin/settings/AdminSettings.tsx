import Container from '@/elements/Container';
import EmailContainer from './EmailContainer';
import { useEffect } from 'react';
import { useAdminStore } from '@/stores/admin';
import getSettings from '@/api/admin/settings/getSettings';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';

export const SettingContainer = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="bg-gray-700/50 rounded-md p-4 h-fit">
      <h1 className="text-4xl font-bold text-white">{title}</h1>

      {children}
    </div>
  );
};

export default () => {
  const { addToast } = useToast();
  const { setSettings } = useAdminStore(state => state.settings);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  });

  return (
    <Container>
      <div className="grid grid-cols-3 gap-4">
        <EmailContainer />
      </div>
    </Container>
  );
};
