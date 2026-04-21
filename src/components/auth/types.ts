import type React from 'react';

export type PersonaType =
  | 'instructional-designer'
  | 'lxd-specialist'
  | 'content-developer'
  | 'id-manager'
  | 'ld-leader';

export interface PersonaStat {
  value: number;
  suffix: string;
  label: string;
}

export interface PersonaData {
  id: PersonaType;
  icon: React.ReactElement;
  label: string;
  title: string;
  subtitle: string;
  benefits: string[];
  stats: PersonaStat[];
  color: string;
  gradient: string;
}
