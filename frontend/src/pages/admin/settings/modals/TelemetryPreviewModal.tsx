import { Group, ModalProps, Stack } from '@mantine/core';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import 'highlight.js/styles/a11y-dark.min.css';

hljs.registerLanguage('json', json);

export default function TelemetryPreviewModal({
  telemetry,
  opened,
  onClose,
}: ModalProps & { telemetry: object | null }) {
  return (
    <Modal title='Telemetry Preview' onClose={onClose} opened={opened} size='lg'>
      <Stack>
        <Code
          block
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(JSON.stringify(telemetry, null, 2), { language: 'json' }).value,
          }}
        />

        <Group>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
