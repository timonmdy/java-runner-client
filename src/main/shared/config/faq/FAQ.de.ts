import { FaqTopic } from "./_index";

export const FAQ_DE: FaqTopic[] = [
  {
    id: 'general',
    label: 'Allgemein',
    items: [
      {
        q: 'Was ist Java Runner Client?',
        a: 'Java Runner Client (JRC) ermöglicht es, JAR-Dateien als dauerhafte Hintergrundprozesse zu starten und zu verwalten. Du erstellst ein Profil für jede JAR, konfigurierst die Argumente und startest/stoppst sie über den Konsolen-Tab.',
      },
      {
        q: 'Wie starte ich am schnellsten?',
        a: '1. Klicke auf „Neues Profil" in der Seitenleiste.\n2. Gehe zu Konfigurieren -> Dateien & Pfade und wähle deine .jar aus.\n3. Gehe zur Konsole und klicke auf Starten.',
      },
      {
        q: 'Wo wird die Konfigurationsdatei gespeichert?',
        a: 'Windows: %APPDATA%\\java-runner-client\\java-runner-config.json\nLinux: ~/.config/java-runner-client/\nmacOS: ~/Library/Application Support/java-runner-client/',
      },
      {
        q: 'Was ist ein „verwalteter" (durch JRC) Prozess?',
        a: 'Ein „verwalteter" Prozess ist ein Java-Prozess, den JRC gestartet hat und überwacht. JRC erzeugt den Prozess direkt über Node.js und kapselt ihn in ein ManagedProcess-Objekt mit Metadaten (PID, Startzeit, Exit-Code). JRC erfasst alle stdout/stderr-Ausgaben in Echtzeit und überwacht den gesamten Prozesslebenszyklus.',
      },
    ],
  },
  {
    id: 'setup',
    label: 'Einrichtung & Konfiguration',
    items: [
      {
        q: 'Warum wird Java beim Starten nicht gefunden?',
        a: 'Java ist nicht installiert oder nicht im System-PATH hinterlegt. Unter Konfigurieren -> Dateien & Pfade kannst du einen expliziten Pfad zur Java-Executable angeben, z.\u00A0B. C:\\Program Files\\Java\\jdk-21\\bin\\java.exe.',
      },
      {
        q: 'Wie stelle ich den JVM-Arbeitsspeicher ein?',
        a: 'Unter Konfigurieren -> JVM-Args fügst du -Xmx2g (maximaler Heap 2 GB) und -Xms512m (initialer Heap 512 MB) hinzu. Jedes Argument steht in einer eigenen Zeile und lässt sich einzeln ein-/ausschalten.',
      },
      {
        q: 'Wie starte ich eine JAR automatisch beim App-Start?',
        a: 'Öffne Konfigurieren -> Allgemein für das Profil und aktiviere „Automatisch starten beim App-Start". Zusätzlich kannst du in den Einstellungen „Beim Windows-Start starten" aktivieren.',
      },
      {
        q: 'Wie sortiere ich Profile in der Seitenleiste um?',
        a: 'Ziehe Profile per Drag-and-Drop in der Seitenleiste an die gewünschte Position. Die neue Reihenfolge wird automatisch gespeichert — kein Bestätigen oder Speichern nötig.',
      },
      {
        q: 'Wie lösche ich ein Profil schnell?',
        a: 'Rechtsklicke auf ein Profil und drücke Löschen. Halte Shift gedrückt, um die Bestätigung zu überspringen und es sofort zu entfernen. Die gleiche Shift-Abkürzung funktioniert auch beim Löschen-Button im Profil-Tab.',
      },
      {
        q: 'Wie nutze ich die „dynamische" JAR-Erkennung?',
        a: 'Unter Konfigurieren -> Dateien & Pfade wählst du „Dynamisch" als JAR-Auswahlmethode. Damit wird die automatische JAR-Erkennung im Arbeitsverzeichnis aktiviert und du kannst das Suchmuster anpassen. Das ist nützlich für Projekte mit versionierten JARs oder wechselnden Dateinamen. Ändere den „app"-Teil im Dateinamensmuster auf den (statischen) Präfix deiner Anwendung und wähle die Art der Versionierung. Du kannst auch reguläre Ausdrücke (RegExp) verwenden, um volle Kontrolle über die Dateierkennung zu haben.',
      },
      {
        q: 'Wie setze ich Umgebungsvariablen für ein Profil?',
        a: 'Gehe zu Konfigurieren -> Umgebung. Füge Schlüssel=Wert-Paare hinzu, die beim Start in die Prozessumgebung eingesetzt werden. Diese überschreiben gleichnamige System-Umgebungsvariablen. Jede Variable lässt sich einzeln ein- oder ausschalten.',
      },
      {
        q: 'Wie verwende ich eine eigene Farbe für mein Profil?',
        a: 'Im Profil-Tab klickst du auf den „+"-Button am Ende der Farbpalette, um den nativen Farbwähler zu öffnen. Jede beliebige Hex-Farbe wird unterstützt.',
      },
    ],
  },
  {
    id: 'console',
    label: 'Konsole',
    items: [
      {
        q: 'Wie sende ich Befehle an einen laufenden Prozess?',
        a: 'Im Konsolen-Tab tippst du in die Eingabezeile unten und drückst Enter. Mit Pfeil-hoch/runter navigierst du durch die Befehlshistorie. Strg+L leert die Ausgabe. Strg+F öffnet die Suche.',
      },
      {
        q: 'Wie kopiere ich eine einzelne Konsolenzeile?',
        a: 'Rechtsklicke auf eine beliebige Zeile in der Konsole, um ein Kontextmenü mit „Zeile kopieren" und „Gesamte Ausgabe kopieren" zu öffnen.',
      },
      {
        q: 'Wie aktiviere ich Zeitstempel in der Konsole?',
        a: 'Gehe zu Einstellungen -> Konsole und aktiviere „Zeitstempel anzeigen". Jede Zeile zeigt dann einen HH:MM:SS.mmm-Zeitstempel.',
      },
      {
        q: 'Was ist der Unterschied zwischen Stoppen und Sofort beenden?',
        a: 'Stoppen sendet ein Shutdown-Signal (wie Strg+C im Terminal). Der Prozess bekommt die Möglichkeit, Daten zu speichern und aufzuräumen. Wenn er nicht innerhalb weniger Sekunden beendet, wird er zwangsweise terminiert.\n\nSofort beenden killt den Prozess sofort, ohne ihm eine Chance zum Aufräumen zu geben. Nutze das nur, wenn Stoppen nicht funktioniert.',
      },
      {
        q: 'Wie öffne ich das Arbeitsverzeichnis eines laufenden Prozesses?',
        a: 'Klicke auf das Ordner-Symbol in der Konsolen-Toolbar. Damit wird das Arbeitsverzeichnis des Profils (oder das JAR-Verzeichnis, falls keins gesetzt ist) im Datei-Explorer geöffnet.',
      },
      {
        q: 'Warum sieht die Konsolenausgabe mit Sonderzeichen komisch aus?',
        a: 'JRC verarbeitet ANSI-Escape-Sequenzen aus der Terminalausgabe. Die meisten Sequenzen (Farben, Cursorbewegung, Fortschrittsbalken) werden automatisch verarbeitet. Wenn ein Tool sehr ungewöhnliche Terminal-Sequenzen verwendet, können einzelne Zeichen durchrutschen.',
      },
    ],
  },
  {
    id: 'logging',
    label: 'Protokollierung',
    items: [
      {
        q: 'Wie speichere ich Konsolenausgaben in eine Datei?',
        a: 'Gehe zu Konfigurieren -> Allgemein und aktiviere „Sitzungslogs in Datei speichern". Bei jedem Start und Stopp eines Prozesses wird eine .log-Datei im Konfigurationsverzeichnis unter logs/<profileId>/ erstellt.',
      },
      {
        q: 'Wo werden Logdateien gespeichert?',
        a: 'Logdateien befinden sich unter:\nWindows: %APPDATA%\\java-runner-client\\logs\\<profileId>\\\nLinux: ~/.config/java-runner-client/logs/<profileId>/\n\nDateinamen enthalten Start- und Stopp-Zeitstempel.',
      },
      {
        q: 'Wie sehe ich vergangene Sitzungslogs ein?',
        a: 'Gehe zum Logs-Tab (neben Konsole und Konfigurieren). Wähle eine Sitzung in der Seitenleiste aus, um ihren Inhalt anzuzeigen. Du kannst auch das gesamte Log kopieren oder alte Dateien löschen.',
      },
      {
        q: 'Kann ich alte Logdateien löschen?',
        a: 'Ja. Im Logs-Tab wählst du eine Logdatei aus und klickst auf das Papierkorb-Symbol. Halte Shift gedrückt, um die Bestätigung zu überspringen. Du kannst auch auf das Ordner-Symbol klicken, um das Log-Verzeichnis zu öffnen und Dateien manuell zu verwalten.',
      },
    ],
  },
  {
    id: 'usage',
    label: 'Nutzung',
    items: [
      {
        q: 'Wie lasse ich JARs nach dem Schließen weiterlaufen?',
        a: 'Aktiviere „Beim Schließen in den Tray minimieren" in den Einstellungen. Das Schließen des Fensters versteckt es dann im System-Tray, anstatt Prozesse zu stoppen.',
      },
      {
        q: 'Wie beende ich einen hängenden Prozess?',
        a: 'Öffne Werkzeuge -> Prozess-Scanner -> Scannen. Java-Prozesse werden hervorgehoben. Klicke auf Beenden neben dem hängenden Prozess, oder nutze „Alle Java-Prozesse beenden" (geschützte Prozesse sind ausgenommen).',
      },
      {
        q: 'Was sind geschützte Prozesse im Scanner?',
        a: 'Geschützte Prozesse (wie „Java Runner Client" selbst) werden im Scanner ausgegraut dargestellt und sind von „Alle Java-Prozesse beenden" ausgenommen. Du kannst sie trotzdem einzeln beenden, indem du auf ihren Beenden-Button klickst und bestätigst.',
      },
    ],
  },
  {
    id: 'examples',
    label: 'Beispiele',
    items: [
      {
        q: 'Wie starte ich einen Minecraft-Server?',
        a: 'Erstelle ein Profil und setze den JAR-Pfad auf deine Server-.jar. Unter Programm-Args füge --nogui hinzu. Setze das Arbeitsverzeichnis auf deinen Server-Ordner. Füge -Xmx4g als JVM-Arg hinzu.',
      },
      {
        q: 'Wie starte ich eine Spring-Boot-App?',
        a: 'Erstelle ein Profil und wähle deine JAR. Unter Properties (-D) füge spring.profiles.active = prod und server.port = 8080 hinzu.',
      },
      {
        q: 'Wie verwende ich eine Profilvorlage?',
        a: 'Klicke auf „Aus Vorlage" in der Seitenleiste. Durchsuche die Vorlagen aus dem GitHub-Repository, wähle eine aus und klicke auf „Profil erstellen". Das neue Profil wird mit sinnvollen Standardwerten für den jeweiligen Anwendungsfall vorbefüllt.',
      },
      {
        q: 'Wie setze ich Umgebungsvariablen wie JAVA_HOME?',
        a: 'Gehe zu Konfigurieren -> Umgebung und füge eine Zeile mit dem Schlüssel JAVA_HOME und dem Pfad zu deiner JDK-Installation hinzu. Schalte sie nach Bedarf ein oder aus, ohne sie entfernen zu müssen.',
      },
    ],
  },
];