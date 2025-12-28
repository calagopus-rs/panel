import { faCheckCircle, faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, List, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import Button from '@/elements/Button.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { OobeComponentProps } from '@/routers/OobeRouter.tsx';

export default function OobeWelcome({ onNext }: OobeComponentProps) {
  const { t } = useTranslations();
  return (
    <Stack gap='xl' py='md'>
      <Group justify='center' mb='md'>
        <img src='/icon.svg' className='h-64 py-4' alt='Calagopus Icon' />
      </Group>

      <div>
        <Title order={2} ta='center' mb='md'>
          {t('pages.oobe.welcome.title', {})}
        </Title>
        <Text size='lg' ta='center' c='dimmed'>
          {t('pages.oobe.welcome.subtitle', {})}
        </Text>
      </div>

      <Stack gap='md' mt='lg'>
        <Text size='sm' fw={500}>
          {t('pages.oobe.welcome.wizardIntro', {})}
        </Text>

        <List
          spacing='sm'
          size='sm'
          center
          icon={
            <ThemeIcon color='teal' size={20} radius='xl'>
              <FontAwesomeIcon icon={faCheckCircle} size='xs' />
            </ThemeIcon>
          }
        >
          <List.Item>{t('pages.oobe.welcome.steps.account', {})}</List.Item>
          <List.Item>{t('pages.oobe.welcome.steps.settings', {})}</List.Item>
          <List.Item>{t('pages.oobe.welcome.steps.location', {})}</List.Item>
          <List.Item>{t('pages.oobe.welcome.steps.node', {})}</List.Item>
          <List.Item>{t('pages.oobe.welcome.steps.server', {})}</List.Item>
        </List>
      </Stack>

      <Group justify='flex-end' mt='xl'>
        <Button leftSection={<FontAwesomeIcon icon={faRocket} />} onClick={onNext}>
          {t('pages.oobe.welcome.button.start', {})}
        </Button>
      </Group>
    </Stack>
  );
}
