import React from 'react';
import { Input } from '../../common/Input';
import { FolderBtn } from './FolderBtn';

interface Props {
  jarPath: string;
  onChange: (path: string) => void;
  onPick: () => void;
}

export function StaticJarPicker({ jarPath, onChange, onPick }: Props) {
  return (
    <Input
      label="JAR File"
      value={jarPath}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Path to your .jar file"
      hint="The JAR file to execute"
      rightElement={<FolderBtn onClick={onPick} />}
    />
  );
}
