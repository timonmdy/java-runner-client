export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqTopic {
  id: string;
  label: string;
  items: FaqItem[];
}

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        q: 'What is Java Runner Client?',
        a: 'Java Runner Client (JRC) lets you run and manage JAR files as persistent background processes. You create a profile for each JAR, configure its arguments, and start/stop it from the Console tab.',
      },
      {
        q: 'How do I get started quickly?',
        a: '1. Click "New Profile" in the sidebar.\n2. Go to Configure -> Files & Paths and select your .jar.\n3. Go to Console and click Run.',
      },
      {
        q: 'Where is the config file stored?',
        a: 'Windows: %APPDATA%\\java-runner-client\\java-runner-config.json\nLinux: ~/.config/java-runner-client/\nmacOS: ~/Library/Application Support/java-runner-client/',
      },
      {
        q: 'What is a "managed" (by JRC) process?',
        a: 'A "managed" process is a Java process that JRC started and is tracking. JRC spawns one process directly via Node.js and wraps it in a ManagedProcess object that tracks metadata (PID, start time, exit code). JRC captures all stdout/stderr output in real-time and monitors the process lifecycle.',
      },
    ],
  },
  {
    id: 'setup',
    label: 'Setup & Config',
    items: [
      {
        q: 'Why is java not found when starting?',
        a: 'Java is not installed or not on your system PATH. In Configure -> Files & Paths, set an explicit path to the java executable, e.g. C:\\Program Files\\Java\\jdk-21\\bin\\java.exe.',
      },
      {
        q: 'How do I pass JVM memory settings?',
        a: 'In Configure -> JVM Args, add -Xmx2g (maximum heap 2 GB) and -Xms512m (initial heap 512 MB). Each argument is on its own row and can be toggled on/off.',
      },
      {
        q: 'How do I auto-start a JAR on app launch?',
        a: 'Open Configure -> General for that profile and enable "Auto-start on app launch". You can also enable "Launch on Windows startup" in Settings.',
      },
      {
        q: 'How do I reorder profiles in the sidebar?',
        a: 'Drag and drop profiles in the sidebar to reorder them. The new order is saved automatically — no need to confirm or press Save.',
      },
      {
        q: 'How can I quickly delete a profile?',
        a: 'Right-click a profile and press Delete. Hold Shift while clicking Delete to skip the confirmation and remove it instantly. The same Shift shortcut works on the Profile tab\'s Delete button.',
      },
      {
        q: 'How do I use "dynamic" JAR resolution?',
        a: 'In Configure -> Files & Paths, select "Dynamic" as the JAR selection method. This enables automatic JAR detection in the working directory and lets you customize the search pattern. This is useful for projects that produce versioned JARs or have changing filenames. Change the "app" part in the filename pattern to the (static) prefix of your app and select the type of versioning to be used. You can also use regular expressions (RegExp) to gain full control over file discovery.',
      },
      {
        q: 'How do I set environment variables for a profile?',
        a: 'Go to Configure -> Environment. Add key=value pairs that will be injected into the process environment when it starts. These override system environment variables with the same key. Each variable can be individually toggled on or off.',
      },
      {
        q: 'How do I use a custom colour for my profile?',
        a: 'On the Profile tab, click the "+" button at the end of the colour palette to open a native colour picker. Any hex colour is supported.',
      },
    ],
  },
  {
    id: 'console',
    label: 'Console',
    items: [
      {
        q: 'How do I send commands to a running process?',
        a: 'On the Console tab, type in the input bar at the bottom and press Enter. Press Up/Down to navigate command history. Ctrl+L clears the output. Ctrl+F opens search.',
      },
      {
        q: 'How do I copy a single console line?',
        a: 'Right-click any line in the console to open a context menu with "Copy line" and "Copy all output" options.',
      },
      {
        q: 'How do I enable timestamps on console lines?',
        a: 'Go to Settings -> Console and enable "Show timestamps". Each line will show an HH:MM:SS.mmm timestamp.',
      },
      {
        q: 'What is the difference between Stop and Force Kill?',
        a: 'Stop sends a graceful shutdown signal (like pressing Ctrl+C in a terminal). The process gets a chance to save data and clean up. If it does not exit within a few seconds, it escalates to a forced termination.\n\nForce Kill immediately terminates the process without giving it any chance to shut down. Use this only if Stop is not working.',
      },
      {
        q: 'How do I open the working directory of a running process?',
        a: 'Click the folder icon in the console toolbar. This opens the profile\'s working directory (or the JAR directory if none is set) in your system file explorer.',
      },
      {
        q: 'Why does console output look garbled with special characters?',
        a: 'JRC processes ANSI escape sequences from terminal output. Most sequences (colours, cursor movement, progress bars) are handled automatically. If a tool uses very unusual terminal sequences, some characters may still leak through.',
      },
    ],
  },
  {
    id: 'logging',
    label: 'Logging',
    items: [
      {
        q: 'How do I save console output to a file?',
        a: 'Go to Configure -> General and enable "Save session logs to file". Each time a process starts and stops, a .log file is written to the config directory under logs/<profileId>/.',
      },
      {
        q: 'Where are log files stored?',
        a: 'Log files are stored at:\nWindows: %APPDATA%\\java-runner-client\\logs\\<profileId>\\\nLinux: ~/.config/java-runner-client/logs/<profileId>/\n\nFilenames include start and stop timestamps.',
      },
      {
        q: 'How do I view past session logs?',
        a: 'Go to the Logs tab (next to Console and Configure). Select a session from the sidebar to view its contents. You can also copy the full log or delete old files.',
      },
      {
        q: 'Can I delete old log files?',
        a: 'Yes. In the Logs tab, select a log file and click the trash icon. Hold Shift to skip the confirmation dialog. You can also click the folder icon to open the logs directory and manage files manually.',
      },
    ],
  },
  {
    id: 'usage',
    label: 'Usage',
    items: [
      {
        q: 'How do I keep JARs running after closing the window?',
        a: 'Enable "Minimize to tray on close" in Settings. Closing the window hides it to the system tray instead of stopping processes.',
      },
      {
        q: 'How do I kill a stuck process?',
        a: 'Open Utilities -> Process Scanner -> Scan. Java processes are highlighted. Click Kill next to the stuck one, or use "Kill All Java" (protected processes are excluded).',
      },
      {
        q: 'What are protected processes in the scanner?',
        a: 'Protected processes (like "Java Runner Client" itself) are shown grayed out in the scanner and are excluded from the "Kill All Java" action. You can still kill them individually by clicking their Kill button and confirming.',
      },
    ],
  },
  {
    id: 'examples',
    label: 'Examples',
    items: [
      {
        q: 'How do I run a Minecraft server?',
        a: 'Create a profile, set the JAR path to your server .jar. In Program Args add --nogui. Set Working Directory to your server folder. Add -Xmx4g as a JVM Arg.',
      },
      {
        q: 'How do I run a Spring Boot app?',
        a: 'Create a profile and set your JAR. In Properties (-D) add spring.profiles.active = prod and server.port = 8080.',
      },
      {
        q: 'How do I use a profile template?',
        a: 'Click "From Template" in the sidebar. Browse templates loaded from the GitHub repository, select one, and click "Create Profile". The new profile will have sensible defaults pre-filled for that use case.',
      },
      {
        q: 'How do I inject environment variables like JAVA_HOME?',
        a: 'Go to Configure -> Environment and add a row with key JAVA_HOME and the value pointing to your JDK installation. Toggle it on/off as needed without removing it.',
      },
    ],
  },
];
