import {
  faCogs,
  faEarthAmerica,
  faGraduationCap,
  faRocket,
  faServer,
  faUsers,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BackgroundImage, Box, Center, Container, Stepper } from '@mantine/core';
import { ComponentType, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import updateOobeSettings from '@/api/admin/settings/updateOobeSettings';
import minecraftBackground from '@/assets/minecraft_background.webp';
import Card from '@/elements/Card';
import { to } from '@/lib/routes';
import OobeConfiguration from '@/pages/oobe/OobeConfiguration';
import OobeFinished from '@/pages/oobe/OobeFinished';
import OobeLocation from '@/pages/oobe/OobeLocation';
import OobeLogin from '@/pages/oobe/OobeLogin';
import OobeNode from '@/pages/oobe/OobeNode';
import OobeRegister from '@/pages/oobe/OobeRegister';
import OobeWelcome from '@/pages/oobe/OobeWelcome';
import { useAuth } from '@/providers/AuthProvider';
import { useGlobalStore } from '@/stores/global';

interface OobeComponentProps {
  onNext: () => void;
}

interface OobeStep {
  path: string;
  stepKey: OobeStepKey | null;
  label: string;
  icon: IconDefinition;
  component: ComponentType<OobeComponentProps>;
  preAuth?: boolean;
}

export const steps: OobeStep[] = [
  {
    path: '',
    stepKey: 'register',
    label: 'Welcome',
    icon: faRocket,
    component: OobeWelcome,
    preAuth: true,
  },
  {
    path: '/register',
    stepKey: null,
    label: 'Register',
    icon: faUsers,
    component: OobeRegister,
    preAuth: true,
  },
  {
    path: '/login',
    stepKey: null,
    label: null,
    icon: null,
    component: OobeLogin,
    preAuth: true,
  },
  {
    path: '/configuration',
    stepKey: 'configuration',
    label: 'Configuration',
    icon: faCogs,
    component: OobeConfiguration,
  },
  {
    path: '/location',
    stepKey: 'location',
    label: 'Location',
    icon: faEarthAmerica,
    component: OobeLocation,
  },
  {
    path: '/node',
    stepKey: 'node',
    label: 'Node',
    icon: faServer,
    component: OobeNode,
  },
  {
    path: '/finish',
    stepKey: 'finished',
    label: 'Finish',
    icon: faGraduationCap,
    component: OobeFinished,
  },
];

export default function OobeRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, setSettings } = useGlobalStore();
  const { user } = useAuth();

  const activeStep = steps.find((step) => to(step.path, '/oobe') === location.pathname);

  const currentAllowedStep = settings.oobeStep ? steps.find((s) => s.stepKey === settings.oobeStep) : null;

  useEffect(() => {
    const isLoginRoute = location.pathname === to('/login', '/oobe');
    const isPreAuth = activeStep?.preAuth ?? false;

    if (!user && !isPreAuth) {
      if (!isLoginRoute) navigate(to('/login', '/oobe'));
      return;
    }

    if (user && currentAllowedStep) {
      const expectedPath = to(currentAllowedStep.path, '/oobe');
      if (location.pathname !== expectedPath) {
        navigate(expectedPath);
      }
      return;
    }
  }, [user, activeStep, currentAllowedStep, location.pathname]);

  const onNext = async () => {
    const idx = steps.findIndex((s) => s.path === activeStep?.path);
    const nextStep = steps[idx + 1];

    if (!nextStep) return;

    if (nextStep.stepKey) {
      updateOobeSettings(nextStep.stepKey).then(() => {
        setSettings({ ...settings, oobeStep: nextStep.stepKey });
      });
    }

    navigate(to(nextStep.path, '/oobe'));
  };

  return (
    <BackgroundImage src={minecraftBackground} h={'100vh'}>
      <Center h={'100%'}>
        <Container w={'100%'}>
          <Card>
            <Stepper active={steps.filter((s) => s.label).findIndex((s) => s.path === activeStep?.path)}>
              {steps
                .filter((s) => s.label)
                .map((step, index) => (
                  <Stepper.Step key={index} label={step.label} icon={<FontAwesomeIcon icon={step.icon} />} />
                ))}
            </Stepper>

            <Box>
              <Routes>
                {steps.map(({ component: Component, ...step }, index) => (
                  <Route key={index} path={step.path} element={<Component onNext={onNext} />} />
                ))}
              </Routes>
            </Box>
          </Card>
        </Container>
      </Center>
    </BackgroundImage>
  );
}
