import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { buildAgentInputActionMenuActions } from './actionMenuActions';

vi.mock('@expo/vector-icons', () => ({
    Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props, null),
    Octicons: (props: Record<string, unknown>) => React.createElement('Octicons', props, null),
}));

vi.mock('@/text', async () => {
    const { createTextModuleMock } = await import('@/dev/testkit/mocks/text');
    return createTextModuleMock({ translate: (key) => key });
});

vi.mock('@/components/ui/theme/haptics', () => ({
    hapticsLight: vi.fn(),
}));

vi.mock('@/agents/catalog/catalog', () => ({
    AGENT_IDS: ['codex', 'claude', 'opencode', 'gemini'],
    DEFAULT_AGENT_ID: 'codex',
    resolveAgentIdFromFlavor: () => null,
    getAgentCore: () => ({ displayNameKey: 'agents.codex' }),
    getAgentBehavior: (agentId: string) => ({
        sessionUsage: {
            contextUsageBadge: agentId === 'gemini' ? 'hidden' : agentId === 'codex' ? 'reportedOnly' : 'derived',
        },
    }),
}));

describe('buildAgentInputActionMenuActions', () => {
    it('keeps the path fallback in the menu without duplicating the visible machine control', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: null,
            profileIcon: 'person-outline',
            machineName: undefined,
            currentPath: '',
            onMachineClick: () => {},
            onPathClick: () => {},
            dismiss: () => {},
            blurInput: () => {},
        });

        const machine = actions.find((action) => action.id === 'machine');
        const path = actions.find((action) => action.id === 'path');

        expect(machine).toBeUndefined();
        expect(path?.label).toBe('newSession.selectPathTitle');
    });

    it('keeps stop ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            canStop: true,
            onStop: () => {},
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'stop',
            'path',
        ]);
    });

    it('includes recipient and delivery extra controls in the collapsed control menu ahead of path', () => {
        const opts = {
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            canStop: true,
            onStop: () => {},
            dismiss: () => {},
            blurInput: () => {},
            extraControlActions: {
                recipient: {
                    id: 'recipient',
                    label: 'Recipient',
                    icon: null,
                    onPress: () => {},
                },
                delivery: {
                    id: 'delivery',
                    label: 'Delivery',
                    icon: null,
                    onPress: () => {},
                },
            },
        } as Parameters<typeof buildAgentInputActionMenuActions>[0];

        const actions = buildAgentInputActionMenuActions(opts);

        expect(actions.map((action) => action.id)).toEqual([
            'stop',
            'recipient',
            'delivery',
            'path',
        ]);
    });

    it('places attachments ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                attachments: {
                    id: 'attachments',
                    label: 'Attach',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'path',
        ]);
    });

    it('places files ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            sessionId: 'session-1',
            onFileViewerPress: () => {},
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'files',
            'path',
        ]);
    });

    it('places linked files ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                linkedFiles: {
                    id: 'linked-files',
                    label: 'common.linkFile',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'linked-files',
            'path',
        ]);
    });

    it('places review comments ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                reviewComments: {
                    id: 'review-comments',
                    label: '1 draft review comment',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'review-comments',
            'path',
        ]);
    });

    it('places connected services ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                connectedServices: {
                    id: 'connected-services',
                    label: 'connectedServices.authChip.label',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'connected-services',
            'path',
        ]);
    });

    it('places storage ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                storage: {
                    id: 'storage',
                    label: 'sessionsList.storageDirectTab',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'storage',
            'path',
        ]);
    });

    it('places grouped shortcut actions ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                shortcuts: [
                    {
                        id: 'session-action:review.start',
                        label: 'Review',
                        icon: null,
                        onPress: () => {},
                    },
                    {
                        id: 'session-action:subagents.delegate.start',
                        label: 'Delegate',
                        icon: null,
                        onPress: () => {},
                    },
                ],
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'session-action:review.start',
            'session-action:subagents.delegate.start',
            'path',
        ]);
    });

    it('places mcp ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                mcp: {
                    id: 'new-session-mcp',
                    label: 'newSession.mcpChipLabel',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'new-session-mcp',
            'path',
        ]);
    });

    it('places automation ahead of path in the collapsed control menu order', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            extraControlActions: {
                automation: {
                    id: 'new-session-automate',
                    label: 'newSession.automationChip.default',
                    icon: null,
                    onPress: () => {},
                },
            },
            onMachineClick: () => {},
            machineName: 'Builder',
            onPathClick: () => {},
            currentPath: '/tmp',
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'new-session-automate',
            'path',
        ]);
    });

    it('keeps session mode in the menu while engine stays directly visible', () => {
        const actions = buildAgentInputActionMenuActions({
            actionBarIsCollapsed: true,
            hasAnyActions: true,
            tint: '#fff',
            agentId: 'codex' as any,
            profileLabel: 'Default',
            profileIcon: 'person-outline',
            agentType: 'codex' as any,
            onAgentClick: () => {},
            sessionModeLabel: 'Build',
            onSessionModeClick: () => {},
            canStop: true,
            onStop: () => {},
            dismiss: () => {},
            blurInput: () => {},
        });

        expect(actions.map((action) => action.id)).toEqual([
            'mode',
            'stop',
        ]);
        expect((actions[0]?.icon as any)?.props?.name).toBe('rocket-launch');
    });
});
