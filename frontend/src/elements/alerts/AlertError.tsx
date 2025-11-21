import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert } from '@mantine/core';

export default function AlertError({ error, setError }: { error: string; setError: (error: string) => void }) {
  return (
    <Alert
      icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
      color='red'
      title='Error'
      onClose={() => setError('')}
      withCloseButton
    >
      {error}
    </Alert>
  );
}
