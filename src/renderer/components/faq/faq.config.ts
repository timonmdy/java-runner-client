export interface FaqItem  { q: string; a: string }
export interface FaqTopic { id: string; label: string; items: FaqItem[] }

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: 'general', label: 'General',
    items: [
      { q: 'What is Java Runner Client?', a: 'Java Runner Client (JRC) lets you run and manage JAR files as persistent background processes. You create a profile for each JAR, configure its arguments, and start/stop it from the Console tab.' },
      { q: 'How do I get started quickly?', a: '1. Click "New Profile" in the sidebar.\n2. Go to Configure → Files & Paths and select your .jar.\n3. Go to Console and click Run.' },
      { q: 'Where is the config file stored?', a: 'Windows: %APPDATA%\\java-runner-client\\java-runner-config.json\nLinux: ~/.config/java-runner-client/\nmacOS: ~/Library/Application Support/java-runner-client/' },
    ],
  },
  {
    id: 'setup', label: 'Setup & Config',
    items: [
      { q: 'Why is java not found when starting?', a: 'Java is not installed or not on your system PATH. In Configure → Files & Paths, set an explicit path to the java executable, e.g. C:\\Program Files\\Java\\jdk-21\\bin\\java.exe.' },
      { q: 'How do I pass JVM memory settings?', a: 'In Configure → JVM Args, add -Xmx2g (maximum heap 2 GB) and -Xms512m (initial heap 512 MB). Each argument is on its own row and can be toggled on/off.' },
      { q: 'How do I auto-start a JAR on app launch?', a: 'Open Configure → General for that profile and enable "Auto-start on app launch". You can also enable "Launch on Windows startup" in Settings.' },
    ],
  },
  {
    id: 'usage', label: 'Usage',
    items: [
      { q: 'How do I send commands to a running process?', a: 'On the Console tab, type in the input bar at the bottom and press Enter. Press Up/Down to navigate command history. Ctrl+L clears the output. Ctrl+F opens search.' },
      { q: 'How do I keep JARs running after closing the window?', a: 'Enable "Minimize to tray on close" in Settings. Closing the window hides it to the system tray instead of stopping processes.' },
      { q: 'How do I kill a stuck process?', a: 'Open Utilities → Process Scanner → Scan. Java processes are highlighted. Click Kill next to the stuck one, or use "Kill All Java".' },
    ],
  },
  {
    id: 'examples', label: 'Examples',
    items: [
      { q: 'How do I run a Minecraft server?', a: 'Create a profile, set the JAR path to your server .jar. In Program Args add --nogui. Set Working Directory to your server folder. Add -Xmx4g as a JVM Arg.' },
      { q: 'How do I run a Spring Boot app?', a: 'Create a profile and set your JAR. In Properties (-D) add spring.profiles.active = prod and server.port = 8080.' },
    ],
  },
]
