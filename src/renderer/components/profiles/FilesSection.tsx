import React from 'react';
import { Input } from '../common/Input';
import { Profile } from '../../../main/shared/types/Profile.types';

interface Props {
  draft: Profile;
  update: (p: Partial<Profile>) => void;
}

export function FilesSection({ draft, update }: Props) {
  const handlePickJar = async () => {
    const p = await window.api.pickJar();
    if (p) update({ jarPath: p });
  };
  const handlePickDir = async () => {
    const p = await window.api.pickDir();
    if (p) update({ workingDir: p });
  };
  const handlePickJava = async () => {
    const p = await window.api.pickJava();
    if (p) update({ javaPath: p });
  };

  return (
    <div className="space-y-4">
      <Input
        label="JAR File"
        value={draft.jarPath}
        onChange={(e) => update({ jarPath: e.target.value })}
        placeholder="Path to your .jar file"
        hint="The JAR file to execute"
        rightElement={<FolderBtn onClick={handlePickJar} />}
      />
      <Input
        label="Working Directory"
        value={draft.workingDir}
        onChange={(e) => update({ workingDir: e.target.value })}
        placeholder="Defaults to JAR directory"
        hint="Leave empty to use the directory containing the JAR"
        rightElement={<FolderBtn onClick={handlePickDir} />}
      />
      <Input
        label="Java Executable"
        value={draft.javaPath}
        onChange={(e) => update({ javaPath: e.target.value })}
        placeholder="java  (uses system PATH)"
        hint="Leave empty to use the java found on PATH"
        rightElement={<FolderBtn onClick={handlePickJava} />}
      />
    </div>
  );
}

function FolderBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-text-muted hover:text-accent transition-colors">
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1 3.5h4l1.5 2H13v7H1V3.5z" />
      </svg>
    </button>
  );
}
