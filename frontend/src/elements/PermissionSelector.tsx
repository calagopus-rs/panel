import Button from '@/elements/Button';
import Card from '@/elements/Card';
import { faChevronDown, faChevronUp, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Checkbox, Group, Title } from '@mantine/core';
import { useState } from 'react';
import { permissionCategoryIconMapping } from '@/lib/enums';

export default ({
  permissions,
  selectedPermissions,
  setSelectedPermissions,
}: {
  permissions: PermissionMap;
  selectedPermissions: string[];
  setSelectedPermissions: (selected: string[]) => void;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    const newExpanded = expandedCategories;
    if (newExpanded.includes(category)) {
      newExpanded.splice(newExpanded.indexOf(category), 1);
    } else {
      newExpanded.push(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionKey: string) => {
    const newSelected = selectedPermissions;
    if (newSelected.includes(permissionKey)) {
      newSelected.splice(newSelected.indexOf(permissionKey), 1);
    } else {
      newSelected.push(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAllInCategory = (category: string) => {
    const categoryPermissions = Object.keys(permissions[category].permissions);
    const allSelected = categoryPermissions.every((perm) => selectedPermissions.includes(`${category}.${perm}`));

    const newSelected = selectedPermissions;

    if (allSelected) {
      categoryPermissions.forEach((perm) => {
        newSelected.splice(newSelected.indexOf(`${category}.${perm}`, 1));
      });
    } else {
      categoryPermissions.forEach((perm) => {
        newSelected.push(`${category}.${perm}`);
      });
    }

    setSelectedPermissions(newSelected);
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(
      Object.entries(permissions).flatMap(([category, { permissions }]) =>
        Object.keys(permissions).map((perm) => `${category}.${perm}`),
      ),
    );
  };

  const getSelectedPermissionsList = () => {
    return Array.from(selectedPermissions).sort();
  };

  const getCategorySelectionState = (category: string) => {
    const categoryPermissions = Object.keys(permissions[category].permissions);
    const selectedCount = categoryPermissions.filter((perm) =>
      selectedPermissions.includes(`${category}.${perm}`),
    ).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermissions.length) return 'all';
    return 'partial';
  };

  return (
    <div className={'grid grid-cols-1 gap-6'}>
      <div className={'space-y-4'}>
        {Object.entries(permissions).map(([category, { description, permissions }]) => {
          const isExpanded = expandedCategories.includes(category);
          const selectionState = getCategorySelectionState(category);

          return (
            <Card key={category}>
              <div className={'flex items-center justify-between gap-1'}>
                <div className={'flex items-center gap-3'}>
                  <FontAwesomeIcon icon={permissionCategoryIconMapping[category]} className={'w-5 h-5 text-gray-50'} />
                  <div>
                    <Title order={5} c={'white'} className={'uppercase'}>
                      {category}
                    </Title>
                    <p className={'text-sm text-gray-200 mt-1'}>{description}</p>
                  </div>
                </div>
                <div className={'flex items-center gap-2'}>
                  <Checkbox
                    onChange={() => toggleAllInCategory(category)}
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
                      const isSelected = selectedPermissions.includes(permissionKey);

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
          Selected Permissions ({selectedPermissions.length})
        </Title>
        <div className={'max-h-96 overflow-y-auto'}>
          {selectedPermissions.length === 0 ? (
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

        <div className={'mt-4'}>
          <Button
            disabled={
              selectedPermissions.length ===
              Object.entries(permissions).flatMap(([_, { permissions }]) => Object.keys(permissions)).length
            }
            onClick={selectAllPermissions}
            className={'w-full'}
          >
            Select All
          </Button>
          <Button
            disabled={selectedPermissions.length === 0}
            color={'red'}
            onClick={() => setSelectedPermissions([])}
            className={'w-full ml-2'}
          >
            Clear All
          </Button>
        </div>
      </Card>
    </div>
  );
};
