import { ReactNode } from 'react';
import { useGlobalStore } from '@/stores/global.ts';
import ContentContainer from './ContentContainer.tsx';

export default function AccountContentContainer({ title, children }: { title: string; children: ReactNode }) {
  const { settings } = useGlobalStore();

  return <ContentContainer title={`${title} | ${settings.app.name}`}>{children}</ContentContainer>;
}
