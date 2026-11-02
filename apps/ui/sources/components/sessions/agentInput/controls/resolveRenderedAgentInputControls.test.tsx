import { describe, expect, it } from 'vitest';
import { resolveRenderedAgentInputControls } from './resolveRenderedAgentInputControls';

describe('resolveRenderedAgentInputControls', () => {
    it('keeps model, machine, attachments and overflow visible while permissions live in the menu', () => {
        const controls = resolveRenderedAgentInputControls({
            layout: 'collapsed',
            coreControlNodesById: {
                engine: ['engine'], permission: ['permission'], actionMenu: ['menu'],
                profile: ['profile'], machine: ['machine'], path: ['path'], resume: ['resume'],
            },
            extraControlNodesById: { attachments: ['attachments'], mcp: ['mcp'], checkout: ['checkout'], automation: ['automation'] },
            extraChips: [],
        });
        expect(controls.chips).toEqual(['engine', 'machine', 'attachments', 'menu']);
        expect(controls.secondaryLeadingControls).toEqual([]);
    });
});
