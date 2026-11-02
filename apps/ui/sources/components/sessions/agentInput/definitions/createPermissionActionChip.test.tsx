import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createPermissionActionChip } from './createPermissionActionChip';

vi.mock('@/text', async () => {
    const { createTextModuleMock } = await import('@/dev/testkit/mocks/text');
    return createTextModuleMock({ translate: (key) => key });
});

describe('permission chip accessibility', () => {
    it.each(['Default', null])('names the icon button when its badge is %s', (label) => {
        const chip = createPermissionActionChip({
            anchorRef: { current: null }, tint: '#000', showLabel: false, label,
            chipStyle: () => ({}), textStyle: {}, onPress: () => {},
        }) as React.ReactElement<{ accessibilityLabel?: string }>;
        expect(chip.props.accessibilityLabel).toBe(label ?? 'agentInput.permissionMode.title');
    });
});
