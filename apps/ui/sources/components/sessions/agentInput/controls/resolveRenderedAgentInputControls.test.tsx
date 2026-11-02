import { describe, expect, it } from 'vitest';
import { resolveRenderedAgentInputControls } from './resolveRenderedAgentInputControls';

describe('resolveRenderedAgentInputControls', () => {
    it('keeps engine, permission and overflow visible while secondary settings live in the menu', () => {
        const controls = resolveRenderedAgentInputControls({
            layout: 'collapsed',
            coreControlNodesById: {
                engine: ['engine'], permission: ['permission'], actionMenu: ['menu'],
                profile: ['profile'], machine: ['machine'], path: ['path'], resume: ['resume'],
            },
            extraControlNodesById: { mcp: ['mcp'], checkout: ['checkout'], automation: ['automation'] },
            extraChips: [],
        });
        expect(controls.chips).toEqual(['engine', 'permission', 'menu']);
        expect(controls.secondaryLeadingControls).toEqual([]);
    });
});
