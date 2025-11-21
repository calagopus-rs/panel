import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Divider, Stack, Text, Title } from '@mantine/core';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import register from '@/api/auth/register';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Captcha from '@/elements/Captcha';
import Card from '@/elements/Card';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { useAuth } from '@/providers/AuthProvider';
import AuthWrapper from './AuthWrapper';

export default function Register() {
  const { doLogin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [nameFirst, setNameFirst] = useState('');
  const [nameLast, setNameLast] = useState('');
  const [password, setPassword] = useState('');
  const captchaRef = useRef(null);

  const submit = () => {
    setLoading(true);

    captchaRef.current?.getToken().then((token) => {
      register({ username, email, name_first: nameFirst, name_last: nameLast, password, captcha: token })
        .then((response) => {
          doLogin(response.user!);
        })
        .catch((msg) => {
          setError(httpErrorToHuman(msg));
        })
        .finally(() => setLoading(false));
    });
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
          <Stack>
            <Title order={2} ta='center'>
              Register
            </Title>
            <Text c='dimmed' ta='center'>
              Please enter your details to register
            </Text>

            <TextInput placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextInput placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextInput placeholder='First Name' value={nameFirst} onChange={(e) => setNameFirst(e.target.value)} />
            <TextInput placeholder='Last Name' value={nameLast} onChange={(e) => setNameLast(e.target.value)} />
            <PasswordInput placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
            <Captcha ref={captchaRef} />

            <Button onClick={submit} loading={loading} size='md' fullWidth>
              Register
            </Button>

            <Divider label='OR' labelPosition='center' />

            <Button variant='light' onClick={() => navigate('/auth/login')} size='md' fullWidth>
              Login
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
}
