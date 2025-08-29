import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthWrapper from './AuthWrapper';
import forgotPassword from '@/api/auth/forgotPassword';
import { httpErrorToHuman } from '@/api/axios';
import Captcha from '@/elements/Captcha';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import { Alert, Card, Divider, Stack, Text, Title } from '@mantine/core';
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { load } from '@/lib/debounce';

export default () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const captchaRef = useRef(null);

  const submit = () => {
    load(true, setLoading);

    captchaRef.current?.getToken().then((token) => {
      forgotPassword(email, token)
        .then(() => {
          setSuccess('An email has been sent to you with instructions on how to reset your password.');
          setRequested(true);
        })
        .catch((msg) => {
          setError(httpErrorToHuman(msg));
        })
        .finally(() => load(false, setLoading));
    });
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
        {success && (
          <Alert
            icon={<FontAwesomeIcon icon={faInfoCircle} />}
            color={'green'}
            title={'Success'}
            onClose={() => setSuccess('')}
            withCloseButton
          >
            {success}
          </Alert>
        )}

        <Card>
          <Stack>
            <Title order={2} ta={'center'}>
              Forgot Password
            </Title>
            <Text c={'dimmed'} ta={'center'}>
              Enter your email to receive instructions on how to reset your password
            </Text>

            <TextInput placeholder={'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Captcha ref={captchaRef} />

            <Button onClick={submit} loading={loading} disabled={requested} size={'md'} fullWidth>
              Request Password Reset
            </Button>

            <Divider label={'OR'} labelPosition={'center'} />

            <Button variant={'light'} onClick={() => navigate('/auth/login')} size={'md'} fullWidth>
              Login
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
};
