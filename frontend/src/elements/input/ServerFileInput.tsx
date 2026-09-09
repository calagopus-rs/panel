import { faFile, faFolder, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AutocompleteProps } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import debounce from 'debounce';
import { useEffect, useMemo, useState } from 'react';
import { makeComponentHookable } from 'shared';
import loadDirectory, { DirectoryResponse } from '@/api/server/files/loadDirectory.ts';
import Spinner from '@/elements/feedback/Spinner.tsx';
import Autocomplete from '@/elements/input/Autocomplete.tsx';
import Group from '@/elements/layout/Group.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import { queryKeys } from '@/lib/queryKeys.ts';
import { useServerCan } from '@/plugins/usePermissions.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

const MAX_SUGGESTIONS = 50;

type Props = Omit<AutocompleteProps, 'value' | 'onChange' | 'data' | 'filter' | 'renderOption'> & {
  serverUuid: string;
  value: string;
  onChange: (value: string) => void;
  mode?: 'file' | 'directory';
};

function splitPath(value: string): { directory: string; prefix: string } {
  const trimmed = value.replace(/^\/+/, '');
  const slash = trimmed.lastIndexOf('/');

  return slash === -1
    ? { directory: '', prefix: trimmed }
    : { directory: trimmed.slice(0, slash), prefix: trimmed.slice(slash + 1) };
}

function checkEntry(
  entries: DirectoryResponse['entries'] | undefined,
  name: string,
  mode: 'file' | 'directory',
): 'notFound' | 'isDirectory' | null {
  if (!entries || name === '' || entries.total > entries.data.length) return null;

  const entry = entries.data.find((candidate) => candidate.name === name);
  if (!entry) return 'notFound';

  return mode === 'file' && entry.directory ? 'isDirectory' : null;
}

function ServerFileInput({ serverUuid, value, onChange, mode = 'file', description, ...rest }: Props) {
  const { t } = useTranslations();
  const canRead = useServerCan('files.read');
  const [opened, setOpened] = useState(false);
  const [settledValue, setSettledValue] = useState(value);

  const updateSettledValue = useMemo(() => debounce((next: string) => setSettledValue(next), 600), []);

  useEffect(() => {
    updateSettledValue(value);
  }, [value]);

  const { directory, prefix } = splitPath(value);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.server(serverUuid).files.pathSuggestions(directory),
    queryFn: () => loadDirectory(serverUuid, `/${directory}`, 1, 'name_asc'),
    enabled: canRead && (opened || settledValue.trim() !== ''),
    staleTime: 30_000,
    retry: false,
  });

  const options = useMemo(() => {
    const lowerPrefix = prefix.toLowerCase();

    return (data?.entries.data ?? [])
      .filter((entry) => mode === 'file' || entry.directory)
      .filter((entry) => entry.name.toLowerCase().startsWith(lowerPrefix))
      .toSorted((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name))
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => {
        const path = `${directory ? `${directory}/` : ''}${entry.name}${entry.directory ? '/' : ''}`;

        return { value: path, label: path, directory: entry.directory };
      });
  }, [data, directory, prefix, mode]);

  const settled = splitPath(settledValue);
  const warning =
    settled.directory === directory && settled.prefix === prefix
      ? checkEntry(data?.entries, settled.prefix, mode)
      : null;

  return (
    <Autocomplete
      {...rest}
      description={
        warning ? (
          <>
            {description} {t(`common.elements.serverFileInput.${warning}`, {})}
          </>
        ) : (
          description
        )
      }
      value={value}
      onChange={onChange}
      data={options}
      filter={({ options }) => options}
      limit={MAX_SUGGESTIONS}
      dropdownOpened={opened && options.length > 0}
      onDropdownOpen={() => setOpened(true)}
      onDropdownClose={() => setOpened(false)}
      onOptionSubmit={(selected) => {
        if (selected.endsWith('/')) {
          setTimeout(() => setOpened(true), 0);
        }
      }}
      rightSection={
        isFetching ? (
          <Spinner size={14} />
        ) : warning ? (
          <Tooltip label={t(`common.elements.serverFileInput.${warning}`, {})}>
            <FontAwesomeIcon icon={faTriangleExclamation} className='text-(--mantine-color-yellow-filled)' />
          </Tooltip>
        ) : undefined
      }
      renderOption={({ option }) => {
        const entry = options.find((candidate) => candidate.value === option.value);

        return (
          <Group gap='xs' wrap='nowrap'>
            <FontAwesomeIcon
              icon={entry?.directory ? faFolder : faFile}
              className='text-(--mantine-color-dimmed) shrink-0'
            />
            <span className='truncate'>{option.value}</span>
          </Group>
        );
      }}
    />
  );
}

export default makeComponentHookable(ServerFileInput);
