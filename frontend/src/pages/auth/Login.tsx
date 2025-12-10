import { faExclamationTriangle, faFingerprint, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Center, Divider, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import checkpointLogin from '@/api/auth/checkpointLogin';
import getOAuthProviders from '@/api/auth/getOAuthProviders';
import getSecurityKeys from '@/api/auth/getSecurityKeys';
import login from '@/api/auth/login';
import postSecurityKeyChallenge from '@/api/auth/postSecurityKeyChallenge';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Captcha, { CaptchaRef } from '@/elements/Captcha';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import PinInput from '@/elements/input/PinInput';
import TextInput from '@/elements/input/TextInput';
import { authPasswordSchema, authTotpSchema, authUsernameSchema } from '@/lib/schemas/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useGlobalStore } from '@/stores/global';
import AuthWrapper from './AuthWrapper';

export default function Login() {
  const { doLogin } = useAuth();
  const { settings } = useGlobalStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'username' | 'passkey' | 'password' | 'totp' | 'totp-recovery'>('username');
  const [oAuthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [passkeyUuid, setPasskeyUuid] = useState('');
  const [passkeyOptions, setPasskeyOptions] = useState<CredentialRequestOptions>();
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const captchaRef = useRef<CaptchaRef>(null);

  const usernameForm = useForm({
    initialValues: {
      username: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(authUsernameSchema),
  });

  const passwordForm = useForm({
    initialValues: {
      password: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(authPasswordSchema),
  });

  const totpForm = useForm({
    initialValues: {
      code: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(authTotpSchema),
  });

  useEffect(() => {
    getOAuthProviders().then((oAuthProviders) => {
      setOAuthProviders(oAuthProviders);
    });
  }, []);

  const doSubmitUsername = () => {
    if (!usernameForm.values.username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    getSecurityKeys(usernameForm.values.username)
      .then((keys) => {
        if (keys.options.publicKey?.allowCredentials?.length === 0) {
          setStep('password');
        } else {
          setPasskeyUuid(keys.uuid);
          setPasskeyOptions(keys.options);
          setStep('passkey');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  const doPasskeyAuth = () => {
    setLoading(true);

    if (!window.navigator.credentials) {
      setError('Your browser does not support passkeys.');
      return;
    }

    window.navigator.credentials
      .get(passkeyOptions)
      .then((credential) => {
        postSecurityKeyChallenge(passkeyUuid, credential as PublicKeyCredential)
          .then((response) => {
            doLogin(response.user);
          })
          .catch((msg) => {
            setError(httpErrorToHuman(msg));
          });
      })
      .catch((err: DOMException) => {
        let message = 'An unexpected error occurred while using your passkey.';

        switch (err.name) {
          case 'AbortError':
            message = 'Passkey request was cancelled.';
            break;
          case 'NotAllowedError':
            message =
              'You dismissed or did not interact with the passkey prompt. The used key could also be not registered.';
            break;
          case 'InvalidStateError':
            message = 'This passkey is not available or already registered.';
            break;
          case 'NotSupportedError':
            message = 'Your browser or device does not support this type of passkey.';
            break;
          case 'SecurityError':
            message = 'Passkeys can only be used over HTTPS and with a valid domain.';
            break;
          case 'UnknownError':
            message = 'Something went wrong with the authenticator.';
            break;
          case 'ConstraintError':
            message = 'The authenticator could not meet the required constraints.';
            break;
          default:
            message = `${err.name}: ${err.message}`;
            break;
        }

        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const doSubmitPassword = () => {
    setLoading(true);

    captchaRef.current?.getToken().then((token) => {
      login({
        user: usernameForm.values.username,
        password: passwordForm.values.password,
        captcha: token,
      })
        .then((response) => {
          if (response.type === 'two_factor_required') {
            setTwoFactorToken(response.token!);
            setStep('totp');
            return;
          }

          doLogin(response.user!);
        })
        .catch((msg) => {
          setError(httpErrorToHuman(msg));
        })
        .finally(() => setLoading(false));
    });
  };

  const doSubmitTotp = () => {
    setLoading(true);

    checkpointLogin({ code: totpForm.values.code, confirmation_token: twoFactorToken })
      .then((response) => {
        doLogin(response.user);
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => setLoading(false));
  };

  return (
    <AuthWrapper>
      <Stack>
        {error && (
          <Alert
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            color='red'
            title='Error'
            onClose={() => setError('')}
            withCloseButton
          >
            {error}
          </Alert>
        )}
        <Card>
          {step === 'username' ? (
            <Stack>
              <Title order={2} ta='center'>
                Login
              </Title>
              <Text c='dimmed' ta='center'>
                Enter your username to continue
              </Text>

              <TextInput
                label='Username'
                placeholder='Enter your username'
                autoComplete='username'
                onKeyDown={(e) => e.key === 'Enter' && doSubmitUsername()}
                leftSection={<FontAwesomeIcon icon={faUser} />}
                size='md'
                {...usernameForm.getInputProps('username')}
              />

              <Button
                onClick={doSubmitUsername}
                disabled={!usernameForm.isValid()}
                loading={loading}
                size='md'
                fullWidth
              >
                Continue
              </Button>

              <Divider label='OR' labelPosition='center' />

              {settings.app.registrationEnabled && (
                <Button variant='light' onClick={() => navigate('/auth/register')} size='md' fullWidth>
                  Register
                </Button>
              )}
              {oAuthProviders.length > 0 && (
                <Button
                  variant='light'
                  disabled={!oAuthProviders.length}
                  onClick={() => navigate('/auth/login/oauth')}
                  size='md'
                  fullWidth
                >
                  OAuth Login
                </Button>
              )}
              <Button variant='light' onClick={() => navigate('/auth/forgot-password')} size='md' fullWidth>
                Forgot Password
              </Button>
            </Stack>
          ) : step === 'passkey' ? (
            <Stack>
              <Title order={2} ta='center'>
                Authenticate with Passkey
              </Title>
              <Text c='dimmed' ta='center'>
                We found a passkey associated with <strong>{usernameForm.values.username}</strong>
              </Text>

              <Button
                onClick={doPasskeyAuth}
                loading={loading}
                leftSection={<FontAwesomeIcon icon={faFingerprint} />}
                size='md'
                fullWidth
              >
                Use Passkey
              </Button>

              <Divider label='OR' labelPosition='center' />

              <Button variant='light' onClick={() => setStep('password')} size='md' fullWidth>
                Use Password
              </Button>
            </Stack>
          ) : step === 'password' ? (
            <Stack>
              <Title order={2} ta='center'>
                Enter Password
              </Title>
              <Text c='dimmed' ta='center'>
                Please enter your password for <strong>{usernameForm.values.username}</strong>
              </Text>

              <PasswordInput
                label='Password'
                placeholder='Enter your password'
                autoComplete='current-password'
                onKeyDown={(e) => e.key === 'Enter' && doSubmitPassword()}
                size='md'
                {...passwordForm.getInputProps('password')}
              />

              <Captcha ref={captchaRef} />

              <Button
                onClick={doSubmitPassword}
                disabled={!passwordForm.isValid()}
                loading={loading}
                size='md'
                fullWidth
              >
                Sign In
              </Button>

              <Divider label='OR' labelPosition='center' />

              <Button variant='light' onClick={() => navigate('/auth/forgot-password')} size='md' fullWidth>
                Forgot Password
              </Button>
            </Stack>
          ) : step === 'totp' ? (
            <Stack>
              <Title order={2} ta='center'>
                Two-Factor Authentication
              </Title>
              <Text c='dimmed' ta='center'>
                Enter the 6-digit code from your authenticator app
              </Text>

              <Center>
                <PinInput
                  length={6}
                  placeholder='0'
                  size='md'
                  type='number'
                  oneTimeCode
                  {...totpForm.getInputProps('code')}
                />
              </Center>

              <Button onClick={doSubmitTotp} loading={loading} disabled={!totpForm.isValid()} size='md' fullWidth>
                Verify Code
              </Button>

              <Divider label='OR' labelPosition='center' />

              <Button
                variant='light'
                onClick={() => {
                  totpForm.reset();
                  setStep('totp-recovery');
                }}
                size='md'
                fullWidth
              >
                Use Recovery Code
              </Button>
            </Stack>
          ) : step === 'totp-recovery' ? (
            <Stack>
              <Title order={2} ta='center'>
                Two-Factor Authentication
              </Title>
              <Text c='dimmed' ta='center'>
                Enter a recovery code
              </Text>

              <Center>
                <TextInput
                  label='Recovery Code'
                  placeholder='Enter a recovery code'
                  onKeyDown={(e) => e.key === 'Enter' && doSubmitTotp()}
                  size='md'
                  {...totpForm.getInputProps('code')}
                />
              </Center>

              <Button onClick={doSubmitTotp} loading={loading} disabled={!totpForm.isValid()} size='md' fullWidth>
                Verify Code
              </Button>

              <Divider label='OR' labelPosition='center' />

              <Button
                variant='light'
                onClick={() => {
                  totpForm.reset();
                  setStep('totp');
                }}
                size='md'
                fullWidth
              >
                Use TOTP
              </Button>
            </Stack>
          ) : null}
        </Card>
      </Stack>
    </AuthWrapper>
  );
}
