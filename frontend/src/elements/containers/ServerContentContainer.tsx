import { ReactNode } from 'react';
import { useServerStore } from '@/stores/server.ts';
import ContentContainer from './ContentContainer.tsx';

export default function ServerContentContainer({ title, children }: { title: string; children: ReactNode }) {
  const { server } = useServerStore();

  return <ContentContainer title={`${title} | ${server.name}`}>{children}</ContentContainer>;
}
