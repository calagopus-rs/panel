import { faInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Stack } from '@mantine/core';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { useState } from 'react';
import Button from '../Button';
import Code from '../Code';
import Modal from '../modals/Modal';
import 'highlight.js/styles/a11y-dark.min.css';

hljs.registerLanguage('json', json);

export default ({ activity }: { activity: ServerActivity | UserActivity }) => {
  const [openModal, setOpenModal] = useState<'view'>(null);

  return (
    <>
      <Modal title={'Activity Details'} onClose={() => setOpenModal(null)} opened={openModal === 'view'}>
        <Stack>
          <Code
            block
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(JSON.stringify(activity.data, null, 2), { language: 'json' }).value,
            }}
          />

          <Group>
            <Button variant={'default'} onClick={() => setOpenModal(null)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ActionIcon onClick={() => setOpenModal('view')}>
        <FontAwesomeIcon icon={faInfo} />
      </ActionIcon>
    </>
  );
};
