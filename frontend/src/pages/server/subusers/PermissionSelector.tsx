import Button from '@/elements/Button';
import Card from '@/elements/Card';
import { useServerStore } from '@/stores/server';
import {
  faStopwatch,
  faBoxArchive,
  faBriefcase,
  faChevronDown,
  faChevronUp,
  faCog,
  faDatabase,
  faFolderOpen,
  faNetworkWired,
  faPlay,
  faTerminal,
  faUsers,
  faX,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Checkbox, Group, Title } from '@mantine/core';
import { useState } from 'react';

const categoryIcons: { [key: string]: IconDefinition } = {
  control: faTerminal,
  files: faFolderOpen,
  databases: faDatabase,
  subusers: faUsers,
  backups: faBoxArchive,
  schedules: faStopwatch,
  allocations: faNetworkWired,
  startup: faPlay,
  settings: faCog,
  activity: faBriefcase,
};

export default ({
  selectedPermissions,
  setSelectedPermissions,
}: {
  selectedPermissions: Set<string>;
  setSelectedPermissions: (selected: Set<string>) => void;
}) => {
  const { availablePermissions } = useServerStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAllInCategory = (category: string) => {
    const categoryPermissions = Object.keys(availablePermissions[category][1]);
    const allSelected = categoryPermissions.every((perm) => selectedPermissions.has(`${category}.${perm}`));

    const newSelected = new Set(selectedPermissions);

    if (allSelected) {
      categoryPermissions.forEach((perm) => {
        newSelected.delete(`${category}.${perm}`);
      });
    } else {
      categoryPermissions.forEach((perm) => {
        newSelected.add(`${category}.${perm}`);
      });
    }

    setSelectedPermissions(newSelected);
  };

  const getSelectedPermissionsList = () => {
    return Array.from(selectedPermissions).sort();
  };

  const getCategorySelectionState = (category: string) => {
    const categoryPermissions = Object.keys(availablePermissions[category][1]);
    const selectedCount = categoryPermissions.filter((perm) => selectedPermissions.has(`${category}.${perm}`)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermissions.length) return 'all';
    return 'partial';
  };

  return (
    <div className={'grid grid-cols-1 gap-6'}>
      <div className={'space-y-4'}>
        {Object.entries(availablePermissions).map(([category, [description, permissions]]) => {
          const isExpanded = expandedCategories.has(category);
          const selectionState = getCategorySelectionState(category);

          return (
            <Card key={category}>
              <div className={'flex items-center justify-between gap-1'}>
                <div className={'flex items-center gap-3'}>
                  <FontAwesomeIcon icon={categoryIcons[category]} className={'w-5 h-5 text-gray-50'} />
                  <div>
                    <Title order={5} c={'white'} className={'uppercase'}>
                      {category}
                    </Title>
                    <p className={'text-sm text-gray-200 mt-1'}>{description}</p>
                  </div>
                </div>
                <div className={'flex items-center gap-2'}>
                  <Checkbox
                    onClick={() => toggleAllInCategory(category)}
                    indeterminate={selectionState === 'partial'}
                    checked={selectionState === 'all'}
                  />
                  <button onClick={() => toggleCategory(category)} className={'p-1 hover:bg-gray-600 rounded'}>
                    {isExpanded ? (
                      <FontAwesomeIcon icon={faChevronUp} className={'w-4 h-4 text-gray-200'} />
                    ) : (
                      <FontAwesomeIcon icon={faChevronDown} className={'w-4 h-4 text-gray-200'} />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className={'p-4'}>
                  <div className={'space-y-3'}>
                    {Object.entries(permissions).map(([permission, permDescription]) => {
                      const permissionKey = `${category}.${permission}`;
                      const isSelected = selectedPermissions.has(permissionKey);

                      return (
                        <Checkbox.Card
                          key={permission}
                          checked={isSelected}
                          onChange={() => togglePermission(permissionKey)}
                          color={isSelected ? 'green' : ''}
                          bd={'0'}
                        >
                          <Group wrap={'nowrap'} align={'flex-start'}>
                            <Checkbox.Indicator />
                            <div>
                              <div className={'text-gray-50 font-bold'}>
                                {permission[0].toUpperCase()}
                                {permission.slice(1)}
                              </div>
                              <div className={'text-sm text-gray-200 mt-1'}>{permDescription}</div>
                            </div>
                          </Group>
                        </Checkbox.Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <Title order={3} c={'white'}>
          Selected Permissions ({selectedPermissions.size})
        </Title>
        <div className={'max-h-96 overflow-y-auto'}>
          {selectedPermissions.size === 0 ? (
            <p className={'text-gray-200 text-sm'}>No permissions selected</p>
          ) : (
            <div className={'space-y-1'}>
              {getSelectedPermissionsList().map((permission) => (
                <Card key={permission} className={'border border-neutral-600'} padding={'xs'}>
                  <Group justify={'space-between'}>
                    <span className={'text-sm font-mono text-white'}>{permission}</span>

                    <ActionIcon color={'red'} onClick={() => togglePermission(permission)}>
                      <FontAwesomeIcon icon={faX} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedPermissions.size > 0 && (
          <div className={'mt-4'}>
            <Button onClick={() => setSelectedPermissions(new Set())} className={'w-full'}>
              Clear All
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
