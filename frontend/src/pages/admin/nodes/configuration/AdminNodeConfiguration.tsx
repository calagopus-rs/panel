import Card from '@/elements/Card';
import Code from '@/elements/Code';
import NumberInput from '@/elements/input/NumberInput';
import TextInput from '@/elements/input/TextInput';
import { Group, Stack, Title } from '@mantine/core';
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/a11y-dark.min.css';
import { useState } from 'react';

hljs.registerLanguage('yaml', yaml);

export default ({ node }: { node: Node }) => {
  const [remote, setRemote] = useState(window.location.origin);
  const [apiPort, setApiPort] = useState(parseInt(new URL(node.url).port || '8080'));
  const [sftpPort, setSftpPort] = useState(node.sftpPort);

  const getNodeConfiguration = () => {
    let origin = window.location.origin;
    try {
      origin = new URL(remote).origin;
    } catch {
      // ignore
    }

    return `
uuid: ${node.uuid}
token_id: ${node.tokenId}
token: ${node.token}
api:
  port: ${apiPort}
  disable_openapi_docs: true
  upload_limit: 10240
system:
  sftp:
    bind_port: ${sftpPort}
remote: ${origin}
    `.trim();
  };

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Node Configuration
        </Title>
      </Group>

      <div className={'grid md:grid-cols-4 grid-cols-1 grid-rows-2 gap-4'}>
        <div className={'flex flex-col md:col-span-3'}>
          <Code
            block
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(getNodeConfiguration(), { language: 'yaml' }).value,
            }}
          />

          <p className={'mt-2'}>
            Place this into the configuration file at <Code>/etc/pterodactyl/config.yml</Code>.
          </p>
        </div>
        <Card>
          <Title className={'text-right'}>Configuration</Title>

          <Stack>
            <TextInput name={'remote'} label={'Remote'} value={remote} onChange={(e) => setRemote(e.target.value)} />
            <NumberInput
              name={'api_port'}
              label={'API Port'}
              value={apiPort}
              onChange={(value) => setApiPort(Number(value))}
            />
            <NumberInput
              name={'sftp_port'}
              label={'SFTP Port'}
              value={sftpPort}
              onChange={(value) => setSftpPort(Number(value))}
            />
          </Stack>
        </Card>
      </div>
    </>
  );
};
