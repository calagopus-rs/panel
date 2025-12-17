import { Stack, Title } from '@mantine/core';
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import Card from '@/elements/Card.tsx';
import Code from '@/elements/Code.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import 'highlight.js/styles/a11y-dark.min.css';
import jsYaml from 'js-yaml';
import { useState } from 'react';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';

hljs.registerLanguage('yaml', yaml);

export default function AdminNodeConfiguration({ node }: { node: Node }) {
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

    return {
      uuid: node.uuid,
      token_id: node.tokenId,
      token: node.token,
      api: {
        port: apiPort,
        disable_openapi_docs: true,
        upload_limit: 10240,
      },
      system: {
        sftp: {
          bind_port: sftpPort,
        },
      },
      allowed_mounts: [],
      remote: origin,
    };
  };

  return (
    <AdminContentContainer title='Node Configuration' titleOrder={2}>
      <div className='grid md:grid-cols-4 grid-cols-1 grid-rows-2 gap-4'>
        <div className='flex flex-col md:col-span-3'>
          <Code
            block
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(jsYaml.dump(getNodeConfiguration()), { language: 'yaml' }).value,
            }}
          />

          <p className='mt-2'>
            Place this into the configuration file at <Code>/etc/pterodactyl/config.yml</Code> or run{' '}
            <Code block>
              wings configure --join-data{' '}
              {btoa(jsYaml.dump(getNodeConfiguration(), { condenseFlow: true, indent: 1, noArrayIndent: true }))}
            </Code>
          </p>
        </div>
        <Card>
          <Title className='text-right'>Configuration</Title>

          <Stack>
            <TextInput name='remote' label='Panel URL' value={remote} onChange={(e) => setRemote(e.target.value)} />
            <NumberInput
              name='api_port'
              label='API Port'
              value={apiPort}
              min={1}
              max={65535}
              onChange={(value) => setApiPort(Number(value))}
            />
            <NumberInput
              name='sftp_port'
              label='SFTP Port'
              value={sftpPort}
              min={1}
              max={65535}
              onChange={(value) => setSftpPort(Number(value))}
            />
          </Stack>
        </Card>
      </div>
    </AdminContentContainer>
  );
}
