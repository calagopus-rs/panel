// Homepage for browsing: /server/<serverId>/files
const _FILES_HOME_REGEX = /^\/server\/[a-z0-9]+\/files$/;

// Matches browsing: /server/<serverId>/files/directory/<directory>
const _FILES_BROWSE_REGEX = /^\/server\/[a-z0-9]+\/files\/directory(\/.*)?$/;

// Matches editing: /server/<serverId>/files/edit/<directory>/<filename>
const _FILES_EDIT_REGEX = /^\/server\/[a-z0-9]+\/files\/edit(\/.*)?$/;

// Matches creation: /server/<serverId>/files/new/<directory>
const _FILES_NEW_REGEX = /^\/server\/[a-z0-9]+\/files\/new(\/.*)?$/;

export function urlPathToAction(path: string): 'browse' | 'edit' | 'new' {
  if (_FILES_BROWSE_REGEX.test(path)) return 'browse';
  if (_FILES_EDIT_REGEX.test(path)) return 'edit';
  if (_FILES_NEW_REGEX.test(path)) return 'new';
  return 'browse';
}

export function urlPathToFilePath(path: string): string {
  if (_FILES_HOME_REGEX.test(path)) return '/';

  switch (urlPathToAction(path)) {
    case 'browse':
      return path.replace(_FILES_BROWSE_REGEX, '$1') || '/';
    case 'edit':
      return path.replace(_FILES_EDIT_REGEX, '$1') || '/';
    case 'new':
      return path.replace(_FILES_NEW_REGEX, '$1') || '/';
    default:
      return '/';
  }
}
