// useBuildStatusPanel.ts - focus state for the private-build status disclosure.
'use client';

import { useCallback, useState } from 'react';
import type {
  BuildStatusPanelItem,
  UseBuildStatusPanelResult,
} from './BuildStatusPanel.types';

function getInitialLabel(items: readonly BuildStatusPanelItem[]): string {
  return items[0]?.label ?? '';
}

export function useBuildStatusPanel(
  items: readonly BuildStatusPanelItem[],
): UseBuildStatusPanelResult {
  const [activeLabel, setActiveLabel] = useState(() => getInitialLabel(items));

  const activeItem = items.find((item) => item.label === activeLabel) ?? items[0] ?? null;

  const selectItem = useCallback((label: string) => {
    setActiveLabel(label);
  }, []);

  return { activeItem, activeLabel, selectItem };
}
