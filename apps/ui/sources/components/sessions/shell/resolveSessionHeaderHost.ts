export type SessionHeaderHostPresentation = Readonly<{
    subtitleLabel: string | null;
    badgeLabel: string | null;
}>;

export function resolveSessionHeaderHost(input: Readonly<{
    machineLabel: string | null;
    folded: boolean;
}>): SessionHeaderHostPresentation {
    const machineLabel = typeof input.machineLabel === 'string' ? input.machineLabel.trim() : '';
    if (!machineLabel || machineLabel === 'unknown') {
        return { subtitleLabel: null, badgeLabel: null };
    }
    return input.folded
        ? { subtitleLabel: machineLabel, badgeLabel: null }
        : { subtitleLabel: null, badgeLabel: machineLabel };
}
