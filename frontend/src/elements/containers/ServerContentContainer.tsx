import { Group, Title } from '@mantine/core';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import TextInput from '@/elements/input/TextInput.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import ContentContainer from './ContentContainer.tsx';

interface Props {
  title: string;
  subtitle?: string;
  hideTitleComponent?: boolean;
  search?: string;
  setSearch?: Dispatch<SetStateAction<string>>;
  contentRight?: ReactNode;
  children: ReactNode;
}

export default function ServerContentContainer({
  title,
  subtitle,
  hideTitleComponent = false,
  search,
  setSearch,
  contentRight,
  children,
}: Props) {
  const { t } = useTranslations();
  const { server } = useServerStore();

  return (
    <ContentContainer title={`${title} | ${server.name}`}>
      {hideTitleComponent ? null : setSearch ? (
        <Group justify='space-between' mb='md'>
          <div>
            <Title order={1} c='white'>
              {title}
            </Title>
            {subtitle ? <p className='text-xs text-gray-300!'>{subtitle}</p> : null}
          </div>
          <Group>
            <TextInput
              placeholder={t('common.input.search', {})}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              w={250}
            />
            {contentRight}
          </Group>
        </Group>
      ) : contentRight ? (
        <Group justify='space-between' mb='md'>
          <div>
            <Title order={1} c='white'>
              {title}
            </Title>
            {subtitle ? <p className='text-xs text-gray-300!'>{subtitle}</p> : null}
          </div>
          <Group>{contentRight}</Group>
        </Group>
      ) : (
        <div>
          <Title order={1} c='white'>
            {title}
          </Title>
          {subtitle ? <p className='text-xs text-gray-300!'>{subtitle}</p> : null}
        </div>
      )}
      {children}
    </ContentContainer>
  );
}
