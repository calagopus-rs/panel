import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import searchFiles from '@/api/server/files/searchFiles.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import Divider from '@/elements/Divider.tsx';
import SizeInput from '@/elements/input/SizeInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverFilesSearchSchema } from '@/lib/schemas/server/files.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useServerStore } from '@/stores/server.ts';

export default function FileSearchModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { settings } = useGlobalStore();
  const { server, browsingDirectory, setBrowsingEntries } = useServerStore();

  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [query, setQuery] = useState('');

  const form = useForm<z.infer<typeof serverFilesSearchSchema>>({
    initialValues: {
      pathFilter: null,
      sizeFilter: null,
      contentFilter: null,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesSearchSchema),
  });

  useEffect(() => {
    if (
      form.values.contentFilter?.maxSearchSize &&
      form.values.contentFilter?.maxSearchSize > settings.server.maxFileManagerContentSearchSize
    ) {
      form.setFieldValue('contentFilter.maxSearchSize', settings.server.maxFileManagerContentSearchSize);
    }
  }, [form.values.contentFilter]);

  useEffect(() => {
    form.setFieldValue('pathFilter', { include: [`**${query}**`], exclude: [], caseInsensitive: true });
  }, [query]);

  useEffect(() => {
    form.reset();

    if (!advanced) {
      form.setFieldValue('pathFilter', { include: [`**${query}**`], exclude: [], caseInsensitive: true });
    }
  }, [advanced]);

  const doSearch = () => {
    setLoading(true);

    searchFiles(server.uuid, { root: browsingDirectory, ...form.values })
      .then((entries) => {
        setBrowsingEntries({ total: entries.length, page: 1, perPage: entries.length, data: entries });
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Search Files' onClose={onClose} opened={opened} size='lg'>
      <form onSubmit={form.onSubmit(() => doSearch())}>
        <Stack>
          <Switch checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} label='Advanced mode toggle' />

          <Divider />

          {!advanced && (
            <TextInput
              withAsterisk
              label='File name'
              placeholder='Query'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          {advanced && (
            <>
              <Card>
                <div className='flex flex-row items-center justify-between'>
                  File Path filter
                  <Switch
                    checked={!!form.values.pathFilter}
                    onChange={(e) =>
                      form.setFieldValue(
                        'pathFilter',
                        e.target.checked ? { include: ['**/**'], exclude: [], caseInsensitive: true } : null,
                      )
                    }
                  />
                </div>
                {form.values.pathFilter && (
                  <Stack mt='md'>
                    <Divider />

                    <Group grow align='start'>
                      <TagsInput
                        label='Include Patterns'
                        placeholder='Include Patterns'
                        {...form.getInputProps('pathFilter.include')}
                      />
                      <TagsInput
                        label='Exclude Patterns'
                        placeholder='Exclude Patterns'
                        {...form.getInputProps('pathFilter.exclude')}
                      />
                    </Group>

                    <Switch
                      label='Search Case Insensitive'
                      description='Search file paths in insensitive mode, "A" will still match "a".'
                      checked={form.values.pathFilter.caseInsensitive}
                      onChange={(e) => form.setFieldValue('pathFilter.caseInsensitive', e.target.checked)}
                    />
                  </Stack>
                )}
              </Card>

              <Card>
                <div className='flex flex-row items-center justify-between'>
                  File Content filter
                  <Switch
                    checked={!!form.values.contentFilter}
                    onChange={(e) =>
                      form.setFieldValue(
                        'contentFilter',
                        e.target.checked
                          ? {
                              query: '',
                              maxSearchSize: settings.server.maxFileManagerContentSearchSize,
                              includeUnmatched: false,
                              caseInsensitive: true,
                            }
                          : null,
                      )
                    }
                  />
                </div>
                {form.values.contentFilter && (
                  <Stack mt='md'>
                    <Divider />

                    <Group grow align='start'>
                      <TextInput
                        withAsterisk
                        label='Query'
                        placeholder='Query'
                        className='col-span-3'
                        {...form.getInputProps('contentFilter.query')}
                      />

                      <SizeInput
                        withAsterisk
                        label='Maximum Search File Size'
                        mode='b'
                        min={0}
                        value={form.values.contentFilter.maxSearchSize}
                        onChange={(value) => form.setFieldValue('contentFilter.maxSearchSize', value)}
                      />
                    </Group>

                    <Group grow align='start'>
                      <Switch
                        label='Include Unmatched Files'
                        description='If a file matches the other filters, but cannot match the content filter due to being too big, still include it.'
                        checked={form.values.contentFilter.includeUnmatched}
                        onChange={(e) => form.setFieldValue('contentFilter.includeUnmatched', e.target.checked)}
                      />
                      <Switch
                        label='Search Case Insensitive'
                        description='Search file content using the query in insensitive mode, "A" will still match "a".'
                        checked={form.values.contentFilter.caseInsensitive}
                        onChange={(e) => form.setFieldValue('contentFilter.caseInsensitive', e.target.checked)}
                      />
                    </Group>
                  </Stack>
                )}
              </Card>

              <Card>
                <div className='flex flex-row items-center justify-between'>
                  File Size filter
                  <Switch
                    checked={!!form.values.sizeFilter}
                    onChange={(e) =>
                      form.setFieldValue('sizeFilter', e.target.checked ? { min: 0, max: 100 * 1024 * 1024 } : null)
                    }
                  />
                </div>
                {form.values.sizeFilter && (
                  <Stack mt='md'>
                    <Divider />

                    <Group grow>
                      <SizeInput
                        withAsterisk
                        label='Minimum'
                        mode='b'
                        min={0}
                        value={form.values.sizeFilter.min}
                        onChange={(value) => form.setFieldValue('sizeFilter.min', value)}
                      />
                      <SizeInput
                        withAsterisk
                        label='Maximum'
                        mode='b'
                        min={0}
                        value={form.values.sizeFilter.max}
                        onChange={(value) => form.setFieldValue('sizeFilter.max', value)}
                      />
                    </Group>
                  </Stack>
                )}
              </Card>
            </>
          )}
        </Stack>

        <Group mt='md'>
          <Button type='submit' loading={loading}>
            Search
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
