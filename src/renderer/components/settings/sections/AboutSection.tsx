import React from 'react';
import { Section, Row } from '../SettingsRow';
import { VersionChecker } from '../VersionChecker';
import { version } from '../../../../../package.json';

export function AboutSection() {
  return (
    <Section title="About">
      <VersionChecker currentVersion={version} />
      <Row label="Stack">
        <span className="font-mono text-xs text-text-secondary">Electron · React · TypeScript</span>
      </Row>
      <Row label="Config">
        <span className="font-mono text-xs text-text-muted">%APPDATA%\java-runner-client</span>
      </Row>
    </Section>
  );
}
