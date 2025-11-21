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

export interface OobeComponentProps {
  onNext: () => void;
  skipFrom?: (step: OobeStepKey) => void;
}

interface OobeStep {
  path: string;
  stepKey: OobeStepKey | null;
  label: string;
  icon: IconDefinition;
  component: ComponentType<OobeComponentProps>;
  preAuth?: boolean;
  skipTo?: OobeStepKey;
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
    skipTo: 'finished',
  },
  {
    path: '/node',
    stepKey: 'node',
    label: 'Node',
    icon: faServer,
    component: OobeNode,
    skipTo: 'finished',
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

  const filteredSteps = () => steps.filter((s) => s.label);

  const onNext = () => {
    const idx = filteredSteps().findIndex((s) => s.path === activeStep?.path);
    const nextStep = filteredSteps()[idx + 1];

    if (!nextStep) return;

    if (nextStep.stepKey) {
      updateOobeSettings(nextStep.stepKey).then(() => {
        setSettings({ ...settings, oobeStep: nextStep.stepKey });
      });
    }

    console.log('navigating', to(nextStep.path, '/oobe'));

    navigate(to(nextStep.path, '/oobe'));
  };

  const skipFrom = (stepKey: OobeStepKey) => {
    const step = steps.find((s) => s.stepKey === stepKey);
    if (!step || !step.skipTo) return;

    const skipToStep = steps.find((s) => s.stepKey === step.skipTo);
    if (!skipToStep) return;

    updateOobeSettings(skipToStep.stepKey).then(() => {
      setSettings({ ...settings, oobeStep: skipToStep.stepKey });
    });
    navigate(to(skipToStep.path, '/oobe'));
  };

  return (
    <BackgroundImage src={minecraftBackground} h='100vh'>
      <Center h='100%'>
        <Container w='100%'>
          <Card>
            <Stepper active={filteredSteps().findIndex((s) => s.path === activeStep?.path)}>
              {filteredSteps().map((step, index) => (
                <Stepper.Step key={index} label={step.label} icon={<FontAwesomeIcon icon={step.icon} />} />
              ))}
            </Stepper>

            <Box>
              <Routes>
                {steps.map(({ component: Component, ...step }, index) => (
                  <Route key={index} path={step.path} element={<Component onNext={onNext} skipFrom={skipFrom} />} />
                ))}
              </Routes>
            </Box>
          </Card>
        </Container>
      </Center>
    </BackgroundImage>
  );
}
