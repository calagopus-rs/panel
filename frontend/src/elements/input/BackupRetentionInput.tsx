import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ReactNode } from 'react';
import Button from '@/elements/buttons/Button.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import Group from '@/elements/layout/Group.tsx';
import Stack from '@/elements/layout/Stack.tsx';
import Popover from '@/elements/overlays/Popover.tsx';
import { type BackupRetention, backupRetentionMax, backupRetentionRules } from '@/lib/schemas/backupRetention.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';

interface BackupRetentionInputProps<T extends Record<string, unknown>> {
  form: UseFormReturnType<T>;
  path: string;
  label?: ReactNode;
  children?: ReactNode;
}

export default function BackupRetentionInput<T extends Record<string, unknown>>({
  form,
  path,
  label,
  children,
}: BackupRetentionInputProps<T>) {
  const { t } = useTranslations();

  const f = form as UseFormReturnType<Record<string, unknown>>;
  const value = f.values[path] as BackupRetention;

  return (
    <Stack gap='xs'>
      <Group gap='xs'>
        {label && <Input.Label>{label}</Input.Label>}

        <Popover position='bottom' withArrow shadow='md'>
          <Popover.Target>
            <Button variant='transparent' size='compact-xs' aria-label={t('common.elements.backupRetention.title', {})}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </Button>
          </Popover.Target>
          <Popover.Dropdown className='max-w-md'>
            <Stack gap='xs'>
              <p className='text-sm text-(--mantine-color-dimmed)'>
                {t('common.elements.backupRetention.description', {})}
              </p>
              <p className='text-sm text-(--mantine-color-dimmed)'>
                {t('common.elements.backupRetention.sourcesDescription', {})}
              </p>
              {children}
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Group>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {backupRetentionRules.map((rule) => (
          <NumberInput
            key={rule}
            label={t(`common.elements.backupRetention.${rule}`, {})}
            min={0}
            max={backupRetentionMax}
            allowDecimal={false}
            value={value[rule] || ''}
            error={f.errors[`${path}.${rule}`]}
            onChange={(count) => f.setFieldValue(path, { ...value, [rule]: count === '' ? 0 : Number(count) })}
          />
        ))}
      </div>

      {f.errors[path] && <Input.Error>{f.errors[path]}</Input.Error>}
    </Stack>
  );
}
