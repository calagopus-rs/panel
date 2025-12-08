import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { useState } from 'react';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import EggRepositoryEggsInstallModal from './modals/EggRepositoryEggsInstallModal';

export default function EggRepositoryEggRow({
  eggRepository,
  egg,
}: {
  eggRepository: AdminEggRepository;
  egg: AdminEggRepositoryEgg;
}) {
  const [openModal, setOpenModal] = useState<'install' | null>(null);

  return (
    <>
      <EggRepositoryEggsInstallModal
        eggRepository={eggRepository}
        egg={egg}
        opened={openModal === 'install'}
        onClose={() => setOpenModal(null)}
      />

      <TableRow>
        <TableData>
          <Code>{egg.path}</Code>
        </TableData>

        <TableData>{egg.name}</TableData>

        <TableData>{egg.author}</TableData>

        <TableData>{egg.description}</TableData>

        <TableData>
          <ActionIcon onClick={() => setOpenModal('install')}>
            <FontAwesomeIcon icon={faDownload} />
          </ActionIcon>
        </TableData>
      </TableRow>
    </>
  );
}
