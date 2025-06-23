const _FILES_HOME_REGEX = /^\/server\/[a-z0-9]+\/files$/;
const _FILES_ACTION_REGEX = /^\/server\/[a-z0-9]+\/files\/(directory|edit)(\/.*)?$/;

export function urlPathToFilePath(path: string): string {
  if (_FILES_HOME_REGEX.test(path)) {
    return '/';
  }

  if (_FILES_ACTION_REGEX.test(path)) {
    return path.replace(_FILES_ACTION_REGEX, '$2');
  }

  return path;
}
