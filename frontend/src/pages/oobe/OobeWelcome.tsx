import { faCheckCircle, faRocket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, List, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { OobeComponentProps } from '@/routers/OobeRouter';

export default function OobeWelcome({ onNext }: OobeComponentProps) {
  return (
    <Stack gap='xl' py='md'>
      <Group justify='center' mb='md'>
        <img src='/icon.svg' className='h-64 py-4' alt='Calagopus Icon' />
      </Group>

      <div>
        <Title order={2} ta='center' mb='md'>
          Welcome to Calagopus
        </Title>
        <Text size='lg' ta='center' c='dimmed'>
          Let's get your game server management system up and running!
        </Text>
      </div>

      <Stack gap='md' mt='lg'>
        <Text size='sm' fw={500}>
          This setup wizard will guide you through:
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
          <List.Item>Creating your administrator account</List.Item>
          <List.Item>Configuring essential system settings</List.Item>
          <List.Item>Setting up your server location</List.Item>
          <List.Item>Adding your first node</List.Item>
          <List.Item>Deploying your first game server</List.Item>
        </List>
      </Stack>

      <Group justify='flex-end' mt='xl'>
        <Button leftSection={<FontAwesomeIcon icon={faRocket} />} onClick={onNext}>
          Get Started
        </Button>
      </Group>
    </Stack>
  );
}
