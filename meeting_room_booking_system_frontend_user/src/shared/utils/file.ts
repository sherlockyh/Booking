export function resolveFileUrl(url?: string) {
  if (!url) {
    return '';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//') ||
    url.startsWith('/')
  ) {
    return url;
  }

  return `/${url}`;
}
