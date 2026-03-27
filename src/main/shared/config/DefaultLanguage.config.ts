import type { LanguageDefinition } from '../types/Language.types';

const ENGLISH_STRINGS = {
  // General
  'general.save': 'Save',
  'general.saved': 'Saved',
  'general.cancel': 'Cancel',
  'general.delete': 'Delete',
  'general.close': 'Close',
  'general.retry': 'Retry',
  'general.copy': 'Copy',
  'general.enabled': 'Enabled',
  'general.disabled': 'Disabled',
  'general.on': 'On',
  'general.off': 'Off',
  'general.yes': 'Yes',
  'general.no': 'No',
  'general.add': 'Add',
  'general.noProfileSelected': 'No profile selected',

  // Sidebar
  'sidebar.newProfile': 'New Profile',
  'sidebar.fromTemplate': 'From Template',
  'sidebar.noProfiles': 'No profiles yet.',
  'sidebar.utilities': 'Utilities',
  'sidebar.faq': 'FAQ',
  'sidebar.settings': 'Settings',
  'sidebar.developer': 'Developer',

  // Profile tabs
  'tabs.console': 'Console',
  'tabs.configure': 'Configure',
  'tabs.logs': 'Logs',
  'tabs.profile': 'Profile',

  // Context menu
  'ctx.select': 'Select',
  'ctx.clearConsole': 'Clear Console',
  'ctx.error': 'Error',

  // Console
  'console.run': 'Run',
  'console.stop': 'Stop',
  'console.forceKill': 'Force Kill',
  'console.forceKillHint': 'Force kill (skip graceful shutdown)',
  'console.openWorkDir': 'Open working directory',
  'console.scrollToBottom': 'scroll to bottom',
  'console.search': 'Search (Ctrl+F)',
  'console.clear': 'Clear (Ctrl+L)',
  'console.lines': 'lines',
  'console.noMatches': 'No matches',
  'console.searchPlaceholder': 'Search console... (Enter next, Shift+Enter prev)',
  'console.inputPlaceholder': 'Send command... (up/down history, Ctrl+L clear, Ctrl+F search)',
  'console.inputDisabled': 'Start the process to send commands',
  'console.waiting': 'Waiting for output...',
  'console.notRunning': 'Process not running. Press Run to start.',
  'console.noJar': 'No JAR configured. Go to Configure to set one.',
  'console.copyLine': 'Copy line',
  'console.copyAll': 'Copy all output',

  // Config tab
  'config.general': 'General',
  'config.files': 'Files & Paths',
  'config.jvm': 'JVM Args',
  'config.props': 'Properties (-D)',
  'config.args': 'Program Args',
  'config.env': 'Environment',
  'config.unsavedChanges': 'unsaved changes',
  'config.restartNeeded': 'restart needed',
  'config.autoStart': 'Auto-start on app launch',
  'config.autoStartHint': 'This JAR starts automatically when Java Runner Client opens.',
  'config.autoRestart': 'Auto-restart on crash',
  'config.autoRestartHint': 'Automatically restarts the process after an unexpected exit.',
  'config.autoRestartInterval': 'Restart delay',
  'config.fileLogging': 'Save session logs to file',
  'config.fileLoggingHint':
    'Write console output to .log files in the config directory per session',
  'config.restartProcess': 'Restart process',
  'config.logging': 'Logging',
  'config.process': 'Process',
  'config.jvmTitle': 'JVM Arguments',
  'config.jvmHint': 'Flags passed to the JVM before -jar, e.g. -Xmx2g  -XX:+UseG1GC',
  'config.propsTitle': 'System Properties',
  'config.propsHint': 'Passed as -Dkey=value. Spring profiles, ports, logging levels, etc.',
  'config.argsTitle': 'Program Arguments',
  'config.argsHint': 'Arguments passed after the JAR, e.g. --nogui  --world myWorld',
  'config.envTitle': 'Environment Variables',
  'config.envHint':
    'Injected into the process environment. Overrides system variables with the same key.',
  'config.commandPreview': 'Command preview',
  'config.pendingArgTitle': 'Unsaved argument input',
  'config.pendingArgMessage':
    'You have text in the argument input that hasn\'t been added yet.\n\nClick "+ Add" first, otherwise it will not take effect.\n\nSwitch anyway?',
  'config.pendingArgConfirm': 'Switch',
  'config.pendingArgCancel': 'Stay',

  // Profile tab
  'profile.identity': 'Profile Identity',
  'profile.name': 'Name',
  'profile.accentColour': 'Accent Colour',
  'profile.accentColourHint': 'Used in the sidebar and as the tab highlight colour.',
  'profile.customColour': 'Pick custom colour',
  'profile.dangerZone': 'Danger Zone',
  'profile.deleteProfile': 'Delete profile',
  'profile.deleteHint':
    'Permanently removes this profile and all its configuration. Hold Shift to skip confirmation.',
  'profile.deleteConfirmTitle': 'Delete profile?',
  'profile.deleteConfirmMessage': '"{name}" will be permanently removed. This cannot be undone.',

  // Logs tab
  'logs.title': 'Session Logs',
  'logs.files': 'files',
  'logs.refresh': 'Refresh',
  'logs.openDir': 'Open logs directory',
  'logs.noFiles': 'No log files yet. Start and stop a process to create one.',
  'logs.selectFile': 'Select a log file to view its contents',
  'logs.loading': 'Loading...',
  'logs.deleteHint': 'Delete log file (hold Shift to skip confirmation)',
  'logs.deleteTitle': 'Delete log file?',
  'logs.deleteMessage': '"{name}" will be permanently deleted.',
  'logs.disabled': 'File logging is disabled for this profile.',
  'logs.disabledHint': 'Enable it in Configure > General > Save session logs to file.',

  // Settings
  'settings.title': 'Application Settings',
  'settings.saved': 'Settings saved',
  'settings.unsaved': 'Unsaved changes',
  'settings.saveChanges': 'Save Changes',

  // Settings: General
  'settings.general': 'General',
  'settings.startup': 'Startup',
  'settings.launchOnStartup': 'Launch on Windows startup',
  'settings.launchOnStartupHint': 'Java Runner Client starts automatically when you log in',
  'settings.startMinimized': 'Start minimized to tray',
  'settings.startMinimizedHint': "Window won't appear on startup -- only the system tray icon",
  'settings.minimizeToTray': 'Minimize to tray on close',
  'settings.minimizeToTrayHint':
    'Closing the window keeps the app and running JARs alive in the background',

  // Settings: Console
  'settings.console': 'Console',
  'settings.fontSize': 'Font size',
  'settings.fontSizeHint': 'Console output font size in pixels',
  'settings.lineNumbers': 'Show line numbers',
  'settings.lineNumbersHint': 'Display a line number gutter in console output',
  'settings.timestamps': 'Show timestamps',
  'settings.timestampsHint': 'Display a timestamp for each console line',
  'settings.wordWrap': 'Word wrap',
  'settings.wordWrapHint': 'Wrap long lines instead of horizontal scrolling',
  'settings.maxLines': 'Max lines in buffer',
  'settings.maxLinesHint': 'Older lines are discarded when the limit is reached',
  'settings.historySize': 'Command history size',
  'settings.historySizeHint': 'Commands stored per session (Up/Down to navigate)',

  // Settings: Appearance
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.themeHint': 'Select a visual theme',
  'settings.themeBuiltin': 'Built-in',
  'settings.themeCheckUpdate': 'Check for theme update',
  'settings.language': 'Language',
  'settings.languageHint': 'Select a display language',
  'settings.languageCheckUpdate': 'Check for language update',

  // Appearance section
  'appearance.refresh': 'Refresh',
  'appearance.loadFromGithub': 'Load from GitHub',
  'appearance.fetchThemesFailed': 'Failed to fetch themes.',
  'appearance.fetchLangsFailed': 'Failed to fetch languages.',
  'appearance.development': 'Development',
  'appearance.syncTitle': 'Sync local project files',
  'appearance.syncHint':
    'Load themes and languages from /themes and /languages in the project root',
  'appearance.sync': 'Sync',
  'appearance.synced': 'Synced',

  // Settings: Advanced
  'settings.advanced': 'Advanced',
  'settings.devMode': 'Developer Options',
  'settings.devModeLabel': 'Toggle Developer Mode (Right-Shift + 7)',
  'settings.devModeHint': 'Enables the Developer tab and DevTools. Use with caution.',
  'settings.restApi': 'REST API',
  'settings.restApiLabel': 'Enable REST API',
  'settings.restApiHint': 'Exposes a local HTTP API for automation (default port {port})',
  'settings.restApiPort': 'Port',
  'settings.restApiPortHint': 'Restart required to change the port',

  // Settings: Updates
  'settings.updates': 'Updates',
  'settings.updateCenter': 'Update Center',
  'settings.checkAll': 'Check All',
  'settings.updateAll': 'Update All',
  'settings.upToDate': 'Up to date',
  'settings.updateAvailable': 'Update available',
  'settings.checking': 'Checking...',
  'settings.checkFailed': 'Check failed',

  // Settings: About
  'settings.about': 'About',
  'settings.version': 'Version',
  'settings.stack': 'Stack',
  'settings.configPath': 'Config',

  // Release modal
  'release.title': 'Release Details',
  'release.preRelease': 'Pre-release',
  'release.stable': 'Stable',
  'release.trustedDev': 'Trusted Developer',
  'release.automation': 'Automated Release',
  'release.unknownPublisher': 'Unknown Publisher',
  'release.unknownPublisherHint':
    'This release was published by a GitHub user not in the trusted list. It was still permitted by GitHub repository security.',
  'release.downloads': 'downloads',
  'release.otherAssets': 'Other assets',
  'release.releaseNotes': 'Release notes',
  'release.viewOnGithub': 'View on GitHub',

  // Utilities
  'utilities.title': 'Utilities',
  'utilities.activityLog': 'Activity Log',
  'utilities.processScanner': 'Process Scanner',

  // Panel headers
  'panels.settings': 'Application Settings',
  'panels.faq': 'FAQ',
  'panels.utilities': 'Utilities',
  'panels.developer': 'Developer',

  // Developer
  'dev.mode': 'Developer Mode',

  // FAQ
  'faq.searchPlaceholder': 'Search FAQ...',
  'faq.noResults': 'No results found.',
  'faq.noItems': 'No items in this topic.',
} as const;

export const ENGLISH: LanguageDefinition = {
  id: 'en',
  name: 'English',
  version: 2,
  author: 'JRC',
  strings: ENGLISH_STRINGS,
};

export { ENGLISH_STRINGS };
