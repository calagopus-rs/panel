import { Anchor } from '@mantine/core';
import { useState } from 'react';
import { z } from 'zod';
import { adminFullUserSchema } from '@/lib/schemas/admin/users.ts';
import { useAdminCan } from '@/plugins/usePermissions.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import OwnerCreateModal from './modals/OwnerCreateModal.tsx';

interface OwnerCreateFieldProps {
  search: string;
  onCreated: (user: z.infer<typeof adminFullUserSchema>) => void;
}

export default function OwnerCreateField({ search, onCreated }: OwnerCreateFieldProps) {
  const { t } = useTranslations();
  const canCreateUsers = useAdminCan('users.create');
  const [opened, setOpened] = useState(false);

  if (!canCreateUsers) {
    return null;
  }

  return (
    <>
      <OwnerCreateModal
        opened={opened}
        onClose={() => setOpened(false)}
        initialSearch={search}
        onCreated={(user) => {
          setOpened(false);
          onCreated(user);
        }}
      />
      <Anchor component='button' type='button' size='sm' onClick={() => setOpened(true)}>
        {t('pages.admin.servers.tabs.general.page.form.ownerCreateHint', {})}
      </Anchor>
    </>
  );
}
