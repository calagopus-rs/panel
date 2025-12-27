import { Group, Title, TitleOrder } from '@mantine/core';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import TextInput from '../input/TextInput.tsx';
import ContentContainer from './ContentContainer.tsx';

interface Props {
  title: string;
  hideTitleComponent?: boolean;
  titleOrder?: TitleOrder;
  search?: string;
  setSearch?: Dispatch<SetStateAction<string>>;
  contentRight?: ReactNode;
  children: ReactNode;
}

export default function AdminContentContainer({
  title,
  hideTitleComponent = false,
  titleOrder = 1,
  search,
  setSearch,
  contentRight,
  children,
}: Props) {
  const { t } = useTranslations();
  const { settings } = useGlobalStore();

  return (
    <ContentContainer title={`${title} | ${settings.app.name}`}>
      {hideTitleComponent ? null : setSearch ? (
        <Group justify='space-between' mb='md'>
          <Title order={titleOrder} c='white'>
            {title}
          </Title>
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
          <Title order={titleOrder} c='white'>
            {title}
          </Title>
          <Group>{contentRight}</Group>
        </Group>
      ) : (
        <Title order={titleOrder} c='white'>
          {title}
        </Title>
      )}
      {children}
    </ContentContainer>
  );
}
