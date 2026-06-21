// BuildStatusPanel.types.ts - contracts for the private-build status panel.
export interface BuildStatusPanelItem {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export interface BuildStatusPanelProps {
  readonly title: string;
  readonly summary: string;
  readonly items: readonly BuildStatusPanelItem[];
}

export interface BuildStatusPanelViewProps extends BuildStatusPanelProps {
  readonly activeItem: BuildStatusPanelItem | null;
  readonly activeLabel: string;
  readonly selectItem: (label: string) => void;
}

export interface UseBuildStatusPanelResult {
  readonly activeItem: BuildStatusPanelItem | null;
  readonly activeLabel: string;
  readonly selectItem: (label: string) => void;
}
