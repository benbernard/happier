import * as React from 'react';

import type { DropdownMenuItem } from '@/components/ui/forms/dropdown/DropdownMenu';
import { Icon } from '@/components/ui/icons/Icon';
import { Modal } from '@/modal';
import { t } from '@/text';
import { setClipboardStringSafe } from '@/utils/ui/clipboard';

export const SESSION_COPY_ID_MENU_ITEM_ID = 'session.copySessionId';

export function createCopySessionIdMenuItem(iconColor: string): DropdownMenuItem {
    return {
        id: SESSION_COPY_ID_MENU_ITEM_ID,
        title: t('sessionInfo.copySessionId'),
        icon: <Icon name="copy" size={16} color={iconColor} />,
    };
}

export async function copySessionIdToClipboard(sessionId: string): Promise<boolean> {
    const copied = await setClipboardStringSafe(sessionId);
    if (!copied) {
        Modal.alert(t('common.error'), t('sessionInfo.failedToCopySessionId'));
    }
    return copied;
}
