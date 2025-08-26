const languageMapping = {
  _coffee: 'coffeescript',
  _js: 'javascript',
  adp: 'tcl',
  al: 'perl',
  ant: 'xml',
  aw: 'php',
  axml: 'xml',
  bash: 'shell',
  bats: 'shell',
  bones: 'javascript',
  boot: 'clojure',
  builder: 'ruby',
  bzl: 'python',
  c: 'c',
  'c++': 'cpp',
  cake: 'coffeescript',
  cats: 'c',
  cc: 'cpp',
  ccxml: 'xml',
  cfg: 'ini',
  cgi: 'shell',
  cjsx: 'coffeescript',
  cl2: 'clojure',
  clixml: 'xml',
  clj: 'clojure',
  cljc: 'clojure',
  'cljs.hl': 'clojure',
  cljs: 'clojure',
  cljscm: 'clojure',
  cljx: 'clojure',
  coffee: 'coffeescript',
  command: 'shell',
  cp: 'cpp',
  cpp: 'cpp',
  cproject: 'xml',
  cql: 'sql',
  csl: 'xml',
  cson: 'coffeescript',
  csproj: 'xml',
  ct: 'xml',
  ctp: 'php',
  cxx: 'cpp',
  ddl: 'sql',
  dfm: 'pascal',
  dita: 'xml',
  ditamap: 'xml',
  ditaval: 'xml',
  'dll.config': 'xml',
  dotsettings: 'xml',
  dpr: 'pascal',
  ecl: 'ecl',
  eclxml: 'ecl',
  es: 'javascript',
  es6: 'javascript',
  ex: 'elixir',
  exs: 'elixir',
  fcgi: 'shell',
  filters: 'xml',
  frag: 'javascript',
  fsproj: 'xml',
  fxml: 'xml',
  gemspec: 'ruby',
  geojson: 'json',
  glade: 'xml',
  gml: 'xml',
  god: 'ruby',
  grxml: 'xml',
  gs: 'javascript',
  gyp: 'python',
  h: 'cpp',
  'h++': 'cpp',
  handlebars: 'handlebars',
  hbs: 'handlebars',
  hcl: 'hcl',
  hh: 'cpp',
  hic: 'clojure',
  hpp: 'cpp',
  htm: 'html',
  'html.hl': 'html',
  html: 'html',
  hxx: 'cpp',
  iced: 'coffeescript',
  idc: 'c',
  iml: 'xml',
  inc: 'sql',
  ini: 'ini',
  inl: 'cpp',
  ipp: 'cpp',
  irbrc: 'ruby',
  ivy: 'xml',
  j2: 'python',
  jake: 'javascript',
  jbuilder: 'ruby',
  jelly: 'xml',
  jinja: 'python',
  jinja2: 'python',
  js: 'javascript',
  jsb: 'javascript',
  jscad: 'javascript',
  jsfl: 'javascript',
  jsm: 'javascript',
  json: 'json',
  jsproj: 'xml',
  jss: 'javascript',
  kml: 'xml',
  ksh: 'shell',
  kt: 'kotlin',
  ktm: 'kotlin',
  kts: 'kotlin',
  launch: 'xml',
  lmi: 'python',
  lock: 'json',
  lpr: 'pascal',
  lua: 'lua',
  markdown: 'markdown',
  md: 'markdown',
  mdpolicy: 'xml',
  mkd: 'markdown',
  mkdn: 'markdown',
  mkdown: 'markdown',
  mm: 'xml',
  mod: 'xml',
  mspec: 'ruby',
  mustache: 'python',
  mxml: 'xml',
  njs: 'javascript',
  nproj: 'xml',
  nse: 'lua',
  nuspec: 'xml',
  odd: 'xml',
  osm: 'xml',
  pac: 'javascript',
  pas: 'pascal',
  pd_lua: 'lua',
  perl: 'perl',
  ph: 'perl',
  php: 'php',
  php3: 'php',
  php4: 'php',
  php5: 'php',
  phps: 'php',
  phpt: 'php',
  pl: 'perl',
  plist: 'xml',
  pluginspec: 'xml',
  plx: 'perl',
  pm: 'perl',
  pod: 'perl',
  podspec: 'ruby',
  pp: 'pascal',
  prc: 'sql',
  prefs: 'ini',
  pro: 'ini',
  properties: 'ini',
  props: 'xml',
  ps1: 'powershell',
  ps1xml: 'xml',
  psc1: 'xml',
  psd1: 'powershell',
  psgi: 'perl',
  psm1: 'powershell',
  pt: 'xml',
  py: 'python',
  pyde: 'python',
  pyp: 'python',
  pyt: 'python',
  pyw: 'python',
  r: 'r',
  rabl: 'ruby',
  rake: 'ruby',
  rb: 'ruby',
  rbuild: 'ruby',
  rbw: 'ruby',
  rbx: 'ruby',
  rbxs: 'lua',
  rd: 'r',
  rdf: 'xml',
  reek: 'yaml',
  'rest.txt': 'restructuredtext',
  rest: 'restructuredtext',
  ron: 'markdown',
  rpy: 'python',
  rq: 'sparql',
  'rs.in': 'rust',
  rs: 'rust',
  rss: 'xml',
  'rst.txt': 'restructuredtext',
  rst: 'restructuredtext',
  rsx: 'r',
  ru: 'ruby',
  ruby: 'ruby',
  rviz: 'yaml',
  sbt: 'scala',
  sc: 'scala',
  scala: 'scala',
  scm: 'scheme',
  scxml: 'xml',
  'sh.in': 'shell',
  sh: 'shell',
  sjs: 'javascript',
  sld: 'scheme',
  sls: 'scheme',
  sparql: 'sparql',
  sps: 'scheme',
  sql: 'sql',
  srdf: 'xml',
  ss: 'scheme',
  ssjs: 'javascript',
  st: 'html',
  storyboard: 'xml',
  sttheme: 'xml',
  sublime_metrics: 'javascript',
  sublime_session: 'javascript',
  'sublime-build': 'javascript',
  'sublime-commands': 'javascript',
  'sublime-completions': 'javascript',
  'sublime-keymap': 'javascript',
  'sublime-macro': 'javascript',
  'sublime-menu': 'javascript',
  'sublime-mousemap': 'javascript',
  'sublime-project': 'javascript',
  'sublime-settings': 'javascript',
  'sublime-snippet': 'xml',
  'sublime-syntax': 'yaml',
  'sublime-theme': 'javascript',
  'sublime-workspace': 'javascript',
  sv: 'systemverilog',
  svh: 'systemverilog',
  syntax: 'yaml',
  t: 'perl',
  tab: 'sql',
  tac: 'python',
  targets: 'xml',
  tcc: 'cpp',
  tcl: 'tcl',
  tf: 'hcl',
  thor: 'ruby',
  tm: 'tcl',
  tmcommand: 'xml',
  tml: 'xml',
  tmlanguage: 'xml',
  tmpreferences: 'xml',
  tmsnippet: 'xml',
  tmtheme: 'xml',
  tmux: 'shell',
  tool: 'shell',
  topojson: 'json',
  tpp: 'cpp',
  ts: 'typescript',
  tsx: 'typescript',
  udf: 'sql',
  ui: 'xml',
  urdf: 'xml',
  ux: 'xml',
  v: 'verilog',
  vbproj: 'xml',
  vcxproj: 'xml',
  veo: 'verilog',
  vh: 'systemverilog',
  viw: 'sql',
  vssettings: 'xml',
  vxml: 'xml',
  w: 'c',
  watchr: 'ruby',
  wlua: 'lua',
  wsdl: 'xml',
  wsf: 'xml',
  wsgi: 'python',
  wxi: 'xml',
  wxl: 'xml',
  wxs: 'xml',
  x3d: 'xml',
  xacro: 'xml',
  xaml: 'xml',
  xht: 'html',
  xhtml: 'html',
  xib: 'xml',
  xlf: 'xml',
  xliff: 'xml',
  xmi: 'xml',
  'xml.dist': 'xml',
  xml: 'xml',
  xproj: 'xml',
  xpy: 'python',
  xsd: 'xml',
  xsjs: 'javascript',
  xsjslib: 'javascript',
  xul: 'xml',
  'yaml-tmlanguage': 'yaml',
  yaml: 'yaml',
  yml: 'yaml',
  zcml: 'xml',
  zsh: 'shell',
};

export function getLanguageFromExtension(extension: string) {
  return languageMapping[extension.toLowerCase()] || 'plaintext';
}

export function isArchiveType(mimetype: string) {
  return [
    'application/vnd.rar', // .rar
    'application/x-rar-compressed', // .rar (2)
    'application/x-tar', // .tar
    'application/x-br', // .tar.br
    'application/x-bzip2', // .tar.bz2, .bz2
    'application/gzip', // .tar.gz, .gz
    'application/x-gzip',
    'application/x-lzip', // .tar.lz4, .lz4 (not sure if this mime type is correct)
    'application/x-sz', // .tar.sz, .sz (not sure if this mime type is correct)
    'application/x-xz', // .tar.xz, .xz
    'application/zstd', // .tar.zst, .zst
    'application/zip', // .zip
    'application/x-7z-compressed', // .7z
  ].includes(mimetype);
}

export function isEditableFile(mimetype: string) {
  const matches = ['application/jar', 'application/octet-stream', 'inode/directory', /^image\/(?!svg\+xml)/];

  if (isArchiveType(mimetype)) return false;

  return matches.every((m) => !mimetype.match(m));
}

export function permissionStringToNumber(mode: string) {
  if (mode.length !== 10) {
    throw new Error('Invalid permission string length.');
  }

  const perms = mode.slice(1); // Skip the first character

  const mapping = {
    r: 4,
    w: 2,
    x: 1,
    '-': 0,
  };

  let result = '';

  for (let i = 0; i < 9; i += 3) {
    let value = 0;
    for (let j = 0; j < 3; j++) {
      value += mapping[perms[i + j]] || 0;
    }
    result += value.toString();
  }

  return parseInt(result, 10);
}

export const archiveFormatExtensionMapping: Record<ArchiveFormat, string> = {
  tar: '.tar',
  tar_gz: '.tar.gz',
  tar_xz: '.tar.xz',
  tar_bz2: '.tar.bz2',
  tar_lz4: '.tar.lz4',
  tar_zstd: '.tar.zst',
  zip: '.zip',
  seven_zip: '.7z',
};

export const streamingArchiveFormatExtensionMapping: Record<StreamingArchiveFormat, string> = {
  tar: '.tar',
  tar_gz: '.tar.gz',
  tar_xz: '.tar.xz',
  tar_bz2: '.tar.bz2',
  tar_lz4: '.tar.lz4',
  tar_zstd: '.tar.zst',
  zip: '.zip',
};

export function generateArchiveName(extension: string) {
  // Get current date
  const now = new Date();

  // Format the date to match Rust's chrono::Local::now().format("%Y-%m-%dT%H%M%S%z")
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Get timezone offset in minutes
  const tzOffset = now.getTimezoneOffset();
  const tzSign = tzOffset <= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const tzMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
  const tzFormatted = `${tzSign}${tzHours}${tzMinutes}`;

  // Create the formatted date string
  const formattedDate = `${year}-${month}-${day}T${hours}${minutes}${seconds}${tzFormatted}`;

  // Return the filename
  return `archive-${formattedDate}${extension}`;
}
