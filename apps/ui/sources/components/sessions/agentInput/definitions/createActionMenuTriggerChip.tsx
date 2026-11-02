import * as React from 'react';
import { Pressable, type View } from 'react-native';

import { t } from '@/text';
import { Icon } from '@/components/ui/icons/Icon';
import { AGENT_INPUT_CHIP_ICON_SIZE_PX, AGENT_INPUT_CHIP_ICON_STYLE } from './agentInputChipIconMetrics';

export function createActionMenuTriggerChip(params: Readonly<{
    anchorRef: React.RefObject<View | null>;
    tint: string;
    showLabel: boolean;
    chipStyle: (pressed: boolean) => any;
    textStyle: any;
    onPress: () => void;
    expanded?: boolean;
}>): React.ReactNode {
    return (
        <Pressable
            ref={params.anchorRef}
            key="action-menu"
            testID="agent-input-action-menu-button"
            accessibilityRole="button"
            accessibilityLabel={t('agentInput.actionMenu.title')}
            accessibilityState={{ expanded: params.expanded ?? false }}
            onPress={params.onPress}
            style={(state) => [params.chipStyle(state.pressed), { minWidth: 48, minHeight: 48, justifyContent: 'center' }]}
        >
            <Icon name="dots-three" size={AGENT_INPUT_CHIP_ICON_SIZE_PX} color={params.tint} style={AGENT_INPUT_CHIP_ICON_STYLE} />
        </Pressable>
    );
}
