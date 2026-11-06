import { describe, expect, it } from 'vitest';

import { resolveSessionHeaderHost } from './resolveSessionHeaderHost';

describe('resolveSessionHeaderHost', () => {
    it('places the host on the subtitle line when folded', () => {
        expect(resolveSessionHeaderHost({ machineLabel: 'Dad Rectangle', folded: true })).toEqual({
            subtitleLabel: 'Dad Rectangle',
            badgeLabel: null,
        });
    });

    it('places the host in the title badge when unfolded', () => {
        expect(resolveSessionHeaderHost({ machineLabel: 'Dad Rectangle', folded: false })).toEqual({
            subtitleLabel: null,
            badgeLabel: 'Dad Rectangle',
        });
    });

    it('trims the machine label and ignores an empty one', () => {
        expect(resolveSessionHeaderHost({ machineLabel: '  NAS  ', folded: false })).toEqual({
            subtitleLabel: null,
            badgeLabel: 'NAS',
        });
        expect(resolveSessionHeaderHost({ machineLabel: '   ', folded: true })).toEqual({
            subtitleLabel: null,
            badgeLabel: null,
        });
        expect(resolveSessionHeaderHost({ machineLabel: 'unknown', folded: false })).toEqual({
            subtitleLabel: null,
            badgeLabel: null,
        });
    });
});
