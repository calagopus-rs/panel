import { faExclamationTriangle, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Divider, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import getOAuthProviders from '@/api/auth/getOAuthProviders';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import AuthWrapper from '../AuthWrapper';

export default function LoginOAuth() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [oAuthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    getOAuthProviders().then((oAuthProviders) => {
      setOAuthProviders(oAuthProviders);
    });
  }, []);

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
              Authenticate with OAuth
            </Title>
            <Text c='dimmed' ta='center'>
              Choose any of the providers below to login
            </Text>

            {oAuthProviders.map((oAuthProvider) => (
              <a key={oAuthProvider.uuid} href={`/api/auth/oauth/redirect/${oAuthProvider.uuid}`}>
                <Button leftSection={<FontAwesomeIcon icon={faFingerprint} />} size='md' fullWidth>
                  Login with {oAuthProvider.name}
                </Button>
              </a>
            ))}

            <Divider label='OR' labelPosition='center' />

            <Button variant='light' onClick={() => navigate('/auth/login')} size='md' fullWidth>
              Back
            </Button>
          </Stack>
        </Card>
      </Stack>
    </AuthWrapper>
  );
}
