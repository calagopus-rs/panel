import {
  faArrowRight,
  faCheckCircle,
  faCogs,
  faEarthAmerica,
  faServer,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import getLocations from '@/api/admin/locations/getLocations.ts';
import getNodes from '@/api/admin/nodes/getNodes.ts';
import updateOobeSettings from '@/api/admin/settings/updateOobeSettings.ts';
import Badge from '@/elements/Badge.tsx';
import Button from '@/elements/Button.tsx';
import Divider from '@/elements/Divider.tsx';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';

export default function OobeFinished() {
  const { user } = useAuth();
  const { settings, setSettings } = useGlobalStore();
  const navigate = useNavigate();

  const locations = useSearchableResource<Location>({
    fetcher: () => getLocations(1),
  });
  const nodes = useSearchableResource<Node>({
    fetcher: () => getNodes(1),
  });

  const handleFinish = () => {
    updateOobeSettings('').then(() => {
      setSettings({ ...settings, oobeStep: null });
      navigate('/');
    });
  };

  return (
    <Stack gap='xl' py='md'>
      <div>
        <Title order={2} ta='center' mb='xs'>
          Setup Complete!
        </Title>
        <Text size='lg' ta='center' c='dimmed'>
          Your Calagopus panel is ready to use
        </Text>
      </div>

      <Paper p='lg' withBorder radius='md' mt='md'>
        <Group mb='md'>
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--mantine-color-teal-6)' }} />
          <Text fw={600} size='sm'>
            What We've Set Up
          </Text>
        </Group>

        <Stack gap='sm'>
          <Group gap='xs'>
            <ThemeIcon size='sm' radius='xl' color='blue' variant='light'>
              <FontAwesomeIcon icon={faUsers} size='xs' />
            </ThemeIcon>
            <div className='flex-1'>
              <Text size='sm' fw={500}>
                Administrator Account
              </Text>
              <Text size='xs' c='dimmed'>
                {user!.username} ({user!.email})
              </Text>
            </div>
          </Group>

          <Divider />

          <Group gap='xs'>
            <ThemeIcon size='sm' radius='xl' color='violet' variant='light'>
              <FontAwesomeIcon icon={faCogs} size='xs' />
            </ThemeIcon>
            <div className='flex-1'>
              <Text size='sm' fw={500}>
                System Configuration
              </Text>
              <Text size='xs' c='dimmed'>
                Panel settings and preferences configured
              </Text>
            </div>
          </Group>

          <Divider />

          <Group gap='xs'>
            <ThemeIcon size='sm' radius='xl' color='cyan' variant='light'>
              <FontAwesomeIcon icon={faEarthAmerica} size='xs' />
            </ThemeIcon>
            <div className='flex-1'>
              <Text size='sm' fw={500}>
                Location
              </Text>
              {locations.items.length > 0 && (
                <Text size='xs' c='dimmed'>
                  {locations.items[0].name}
                </Text>
              )}
            </div>
            {locations.items.length < 1 && (
              <Badge color='orange' size='sm'>
                Skipped
              </Badge>
            )}
          </Group>

          <Divider />

          <Group gap='xs'>
            <ThemeIcon size='sm' radius='xl' color='orange' variant='light'>
              <FontAwesomeIcon icon={faServer} size='xs' />
            </ThemeIcon>
            <div className='flex-1'>
              <Text size='sm' fw={500}>
                Node
              </Text>
              {nodes.items.length > 0 && (
                <Text size='xs' c='dimmed'>
                  {nodes.items[0].name}
                </Text>
              )}
            </div>
            {nodes.items.length < 1 && (
              <Badge color='orange' size='sm'>
                Skipped
              </Badge>
            )}
          </Group>
        </Stack>
      </Paper>

      <Group justify='center' mt='lg'>
        <Button size='lg' rightSection={<FontAwesomeIcon icon={faArrowRight} />} onClick={handleFinish}>
          Go to Dashboard
        </Button>
      </Group>
    </Stack>
  );
}
