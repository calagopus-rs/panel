import { Button } from '@/elements/button';
import { useServerStore } from '@/stores/server';
import {
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
import { useState } from 'react';

const categoryIcons: { [key: string]: IconDefinition } = {
  control: faTerminal,
  files: faFolderOpen,
  databases: faDatabase,
  subusers: faUsers,
  backups: faBoxArchive,
  allocations: faNetworkWired,
  startup: faPlay,
  settings: faCog,
  activity: faBriefcase,
};

export default () => {
  const { availablePermissions } = useServerStore();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
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
    const allSelected = categoryPermissions.every(perm => selectedPermissions.has(`${category}.${perm}`));

    const newSelected = new Set(selectedPermissions);

    if (allSelected) {
      categoryPermissions.forEach(perm => {
        newSelected.delete(`${category}.${perm}`);
      });
    } else {
      categoryPermissions.forEach(perm => {
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
    const selectedCount = categoryPermissions.filter(perm => selectedPermissions.has(`${category}.${perm}`)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermissions.length) return 'all';
    return 'partial';
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-4">
        {Object.entries(availablePermissions).map(([category, [description, permissions]]) => {
          const isExpanded = expandedCategories.has(category);
          const selectionState = getCategorySelectionState(category);

          return (
            <div key={category} className="bg-gray-500 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={categoryIcons[category]} className="w-5 h-5 text-gray-50" />
                    <div>
                      <h3 className="font-semibold text-gray-50 capitalize">{category}</h3>
                      <p className="text-sm text-gray-200 mt-1">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAllInCategory(category)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectionState === 'all'
                          ? 'bg-blue-600 text-white'
                          : selectionState === 'partial'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-600 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {selectionState === 'all' ? 'All' : selectionState === 'partial' ? 'Some' : 'None'}
                    </button>
                    <button onClick={() => toggleCategory(category)} className="p-1 hover:bg-gray-600 rounded">
                      {isExpanded ? (
                        <FontAwesomeIcon icon={faChevronUp} className="w-4 h-4 text-gray-200" />
                      ) : (
                        <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-200" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4">
                  <div className="space-y-3">
                    {Object.entries(permissions).map(([permission, permDescription]) => {
                      const permissionKey = `${category}.${permission}`;
                      const isSelected = selectedPermissions.has(permissionKey);

                      return (
                        <div key={permission} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={permissionKey}
                            checked={isSelected}
                            onChange={() => togglePermission(permissionKey)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={permissionKey} className="flex-1 cursor-pointer">
                            <div className="text-gray-50 font-bold">{permission}</div>
                            <div className="text-sm text-gray-200 mt-1">{permDescription}</div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <div className="bg-gray-500 rounded-lg p-4">
          <h3 className="font-semibold text-gray-50 mb-3">Selected Permissions ({selectedPermissions.size})</h3>
          <div className="max-h-96 overflow-y-auto">
            {selectedPermissions.size === 0 ? (
              <p className="text-gray-200 text-sm">No permissions selected</p>
            ) : (
              <div className="space-y-1">
                {getSelectedPermissionsList().map(permission => (
                  <div
                    key={permission}
                    className="flex items-center justify-between bg-gray-600 px-3 py-2 rounded border border-gray-400"
                  >
                    <span className="text-sm font-mono text-white">{permission}</span>
                    <Button
                      style={Button.Styles.Red}
                      shape={Button.Shapes.IconSquare}
                      size={Button.Sizes.Small}
                      onClick={() => togglePermission(permission)}
                      className="w-6! h-6!"
                    >
                      <FontAwesomeIcon icon={faX} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPermissions.size > 0 && (
            <div className="mt-4">
              <Button onClick={() => setSelectedPermissions(new Set())} className="w-full">
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
