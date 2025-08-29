import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import { useAuth } from '@/providers/AuthProvider';
import Captcha from '@/elements/Captcha';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { Alert, Center, Divider, Stack, Text, Title } from '@mantine/core';
import Card from '@/elements/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faFingerprint, faUser } from '@fortawesome/free-solid-svg-icons';
import getSecurityKeys from '@/api/auth/getSecurityKeys';
import postSecurityKeyChallenge from '@/api/auth/postSecurityKeyChallenge';
import { httpErrorToHuman } from '@/api/axios';
import PasswordInput from '@/elements/input/PasswordInput';
import login from '@/api/auth/login';
import PinInput from '@/elements/input/PinInput';
import checkpointLogin from '@/api/auth/checkpointLogin';
import { load } from '@/lib/debounce';

export default () => {
  const { doLogin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'username' | 'passkey' | 'password' | 'totp' | 'totp-recovery'>('username');
  const [username, setUsername] = useState('');
  const [passkeyUuid, setPasskeyUuid] = useState('');
  const [passkeyOptions, setPasskeyOptions] = useState<CredentialRequestOptions>(null);
  const [password, setPassword] = useState('');
  const captchaRef = useRef(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const doSubmitUsername = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    load(true, setLoading);
    setError('');

    getSecurityKeys(username)
      .then((keys) => {
        if (keys.options.publicKey.allowCredentials.length === 0) {
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
      .finally(() => {
        load(false, setLoading);
      });
  };

  const doPasskeyAuth = () => {
    load(true, setLoading);

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
      .finally(() => {
        load(false, setLoading);
      });
  };

  const doSubmitPassword = () => {
    load(true, setLoading);

    captchaRef.current?.getToken().then((token) => {
      login({ user: username, password, captcha: token })
        .then((response) => {
          if (response.type === 'two_factor_required') {
            setTwoFactorToken(response.token!);
            setStep('totp');
            return;
          }

          doLogin(response.user);
        })
        .catch((msg) => {
          setError(httpErrorToHuman(msg));
        })
        .finally(() => load(false, setLoading));
    });
  };

  const doSubmitTotp = () => {
    load(true, setLoading);

    checkpointLogin({ code: totpCode, confirmation_token: twoFactorToken })
      .then((response) => {
        doLogin(response.user);
      })
      .catch((msg) => {
        setError(httpErrorToHuman(msg));
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <AuthWrapper>
      <Stack>
        {error && (
          <Alert
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            color={'red'}
            title={'Error'}
            onClose={() => setError('')}
            withCloseButton
          >
            {error}
          </Alert>
        )}
        <Card>
          {step === 'username' ? (
            <Stack>
              <Title order={2} ta={'center'}>
                Login
              </Title>
              <Text c={'dimmed'} ta={'center'}>
                Enter your username to continue
              </Text>

              <TextInput
                label={'Username'}
                placeholder={'Enter your username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSubmitUsername()}
                leftSection={<FontAwesomeIcon icon={faUser} />}
                size={'md'}
              />

              <Button onClick={doSubmitUsername} loading={loading} size={'md'} fullWidth>
                Continue
              </Button>

              <Divider label={'OR'} labelPosition={'center'} />

              <Button variant={'light'} onClick={() => navigate('/auth/register')} size={'md'} fullWidth>
                Register
              </Button>
              <Button variant={'light'} onClick={() => navigate('/auth/forgot-password')} size={'md'} fullWidth>
                Forgot Password
              </Button>
            </Stack>
          ) : step === 'passkey' ? (
            <Stack>
              <Title order={2} ta={'center'}>
                Authenticate with Passkey
              </Title>
              <Text c={'dimmed'} ta={'center'}>
                We found a passkey associated with <strong>{username}</strong>
              </Text>

              <Button
                onClick={doPasskeyAuth}
                loading={loading}
                leftSection={<FontAwesomeIcon icon={faFingerprint} />}
                size={'md'}
                fullWidth
              >
                Use Passkey
              </Button>

              <Divider label={'OR'} labelPosition={'center'} />

              <Button variant={'light'} onClick={() => setStep('password')} size={'md'} fullWidth>
                Use Password
              </Button>
            </Stack>
          ) : step === 'password' ? (
            <Stack>
              <Title order={2} ta={'center'}>
                Enter Password
              </Title>
              <Text c={'dimmed'} ta={'center'}>
                Please enter your password for <strong>{username}</strong>
              </Text>

              <PasswordInput
                label={'Password'}
                placeholder={'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSubmitPassword()}
                size={'md'}
              />

              <Captcha ref={captchaRef} />

              <Button onClick={doSubmitPassword} loading={loading} size={'md'} fullWidth>
                Sign In
              </Button>

              <Divider label={'OR'} labelPosition={'center'} />

              <Button variant={'light'} onClick={() => navigate('/auth/forgot-password')} size={'md'} fullWidth>
                Forgot Password
              </Button>
            </Stack>
          ) : step === 'totp' ? (
            <Stack>
              <Title order={2} ta={'center'}>
                Two-Factor Authentication
              </Title>
              <Text c={'dimmed'} ta={'center'}>
                Enter the 6-digit code from your authenticator app
              </Text>

              <Center>
                <PinInput
                  length={6}
                  value={totpCode}
                  onChange={setTotpCode}
                  placeholder={'0'}
                  size={'md'}
                  type={'number'}
                />
              </Center>

              <Button onClick={doSubmitTotp} loading={loading} disabled={totpCode.length !== 6} size={'md'} fullWidth>
                Verify Code
              </Button>

              <Divider label={'OR'} labelPosition={'center'} />

              <Button
                variant={'light'}
                onClick={() => {
                  setTotpCode('');
                  setStep('totp-recovery');
                }}
                size={'md'}
                fullWidth
              >
                Use Recovery Code
              </Button>
            </Stack>
          ) : step === 'totp-recovery' ? (
            <Stack>
              <Title order={2} ta={'center'}>
                Two-Factor Authentication
              </Title>
              <Text c={'dimmed'} ta={'center'}>
                Enter a recovery code
              </Text>

              <Center>
                <TextInput
                  label={'Recovery Code'}
                  placeholder={'Enter a recovery code'}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSubmitTotp()}
                  size={'md'}
                />
              </Center>

              <Button onClick={doSubmitTotp} loading={loading} disabled={!totpCode} size={'md'} fullWidth>
                Verify Code
              </Button>

              <Divider label={'OR'} labelPosition={'center'} />

              <Button
                variant={'light'}
                onClick={() => {
                  setTotpCode('');
                  setStep('totp');
                }}
                size={'md'}
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
};
