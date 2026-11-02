import { test, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { createRunDirs } from '../../src/testkit/runDir';
import { startServerLight, type StartedServer } from '../../src/testkit/process/serverLight';
import { startUiWeb, type StartedUiWeb } from '../../src/testkit/process/uiWeb';
import { type StartedDaemon } from '../../src/testkit/daemon/daemon';
import { authenticateAndStartDaemon } from '../../src/testkit/uiE2e/authenticateAndStartDaemon';
import { ensureAccountReadyForConnect } from '../../src/testkit/uiE2e/ensureAccountReadyForConnect';
import { gotoDomContentLoadedWithRetries, normalizeLoopbackBaseUrl } from '../../src/testkit/uiE2e/pageNavigation';
import { appendBrowserDiagnostics, collectBrowserDiagnostics } from '../../src/testkit/uiE2e/browserDiagnostics';
import { mutateUiE2eScopedAccountSettings } from '../../src/testkit/uiE2e/scopedAccountSettingsStorage';

const run = createRunDirs({ runLabel: 'ui-e2e' });

const startNewSessionTestIds = [
    'main-header-start-new-session',
    'home-header-start-new-session',
    'nav-new-session',
    'session-getting-started-start-new-session',
] as const;

async function firstVisibleByTestId(
    page: Page,
    testIds: readonly string[],
): Promise<Locator | null> {
    for (const testId of testIds) {
        const locator = page.getByTestId(testId);
        const count = await locator.count();
        for (let index = 0; index < count; index += 1) {
            const candidate = locator.nth(index);
            if (await candidate.isVisible().catch(() => false)) {
                return candidate;
            }
        }
    }
    return null;
}

async function waitForVisibleByTestId(
    page: Page,
    testIds: readonly string[],
    timeoutMs: number,
): Promise<Locator> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const locator = await firstVisibleByTestId(page, testIds);
        if (locator) return locator;

        await page.waitForTimeout(250);
    }

    throw new Error(`Timed out waiting for visible testID in ${testIds.join(', ')}`);
}

test.describe('ui e2e: new-session formSheet responsiveness', () => {
    test.describe.configure({ mode: 'serial' });

    const suiteDir = run.testDir('new-session-formsheet-responsiveness-suite');
    const cliHomeDir = resolve(join(suiteDir, 'cli-home'));

    let server: StartedServer | null = null;
    let ui: StartedUiWeb | null = null;
    let uiBaseUrl: string | null = null;
    let daemon: StartedDaemon | null = null;
    let authStorageState: AuthStorageState | null = null;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(900_000);
        await mkdir(suiteDir, { recursive: true });
        await mkdir(cliHomeDir, { recursive: true });

        server = await startServerLight({
            testDir: suiteDir,
            dbProvider: 'sqlite',
            extraEnv: {
                HAPPIER_BUILD_FEATURES_DENY: 'sharing.contentKeys',
                HAPPIER_PUBLIC_SERVER_URL: '',
                HAPPIER_LOCAL_SERVER_URL: '',
            },
        });

        ui = await startUiWeb({
            testDir: suiteDir,
            env: {
                ...process.env,
                EXPO_PUBLIC_HAPPIER_SERVER_URL: server.baseUrl,
                EXPO_PUBLIC_HAPPY_SERVER_URL: server.baseUrl,
                EXPO_PUBLIC_HAPPY_STORAGE_SCOPE: `e2e-${run.runId}`,
            },
        });
        uiBaseUrl = normalizeLoopbackBaseUrl(ui.baseUrl);

        // Authenticate once so every test can open its own context from the saved session.
        const authContext = await browser.newContext();
        try {
            const page = await authContext.newPage();
            await gotoDomContentLoadedWithRetries(page, `${uiBaseUrl}/?happier_hmr=0`, 240_000);
            daemon = await authenticateAndStartDaemon({
                page,
                testDir: suiteDir,
                cliHomeDir,
                serverUrl: server.baseUrl,
                uiBaseUrl,
                terminalConnectUrlTimeoutMs: 180_000,
                daemonStartupTimeoutMs: 180_000,
                extraEnv: {
                    HAPPIER_PUBLIC_SERVER_URL: server.baseUrl,
                    HAPPIER_LOCAL_SERVER_URL: server.baseUrl,
                },
            });
            await gotoDomContentLoadedWithRetries(page, `${uiBaseUrl}/?happier_hmr=0`, 240_000);
            await ensureAccountReadyForConnect({ page, timeoutMs: 120_000, clickCreateAccount: false });
            await mutateUiE2eScopedAccountSettings({
                page,
                experiments: true,
                featureToggles: { 'attachments.uploads': true },
            });
            authStorageState = await authContext.storageState();
        } finally {
            await authContext.close();
        }
    });

    test.afterAll(async () => {
        test.setTimeout(120_000);
        await daemon?.stop().catch(() => {});
        await ui?.stop().catch(() => {});
        await server?.stop().catch(() => {});
    });

    test('opens from the sessions surface and closes through the stable cancel affordance', async ({ browser }) => {
        test.setTimeout(180_000);
        if (!uiBaseUrl || !authStorageState) throw new Error('missing ui/auth fixtures');

        const context = await browser.newContext({ storageState: authStorageState });
        try {
            const { page, diagnostics } = await openNewSessionFromSessionsSurface(context, uiBaseUrl);
            try {

                await page.getByTestId('new-session-composer-input').fill('formsheet responsiveness smoke');
                await expect(page.getByTestId('new-session-composer-input')).toHaveValue('formsheet responsiveness smoke');
                await expect(page.getByTestId('new-session-composer-send')).toBeVisible({ timeout: 60_000 });

                await expect(page.getByTestId('new-session-cancel')).toBeVisible({ timeout: 60_000 });
                await page.getByTestId('new-session-cancel').click();

                await page.waitForURL((url) => !url.pathname.endsWith('/new'), { timeout: 60_000 });
                await expect(page.getByTestId('new-session-composer-input')).toHaveCount(0);
            } catch (error) {
                throw appendBrowserDiagnostics(error, diagnostics());
            }
        } finally {
            await context.close();
        }
    });

    test('keeps the large editor and overflow usable on phone, unfolded and short windows', async ({ browser }) => {
        test.setTimeout(240_000);
        if (!uiBaseUrl || !authStorageState) throw new Error('missing ui/auth fixtures');
        for (const size of [
            { width: 390, height: 844, fontScale: 1, colorScheme: 'light' as const },
            { width: 840, height: 920, fontScale: 2, colorScheme: 'dark' as const },
            { width: 844, height: 390, fontScale: 2, colorScheme: 'dark' as const },
        ]) {
            const context = await browser.newContext({ storageState: authStorageState, viewport: size, colorScheme: size.colorScheme });
            try {
                await context.addInitScript((fontScale) => {
                    window.localStorage.setItem('mmkv.default\\local-settings', JSON.stringify({ uiFontScale: fontScale }));
                }, size.fontScale);
                const { page, diagnostics } = await openNewSessionFromSessionsSurface(context, uiBaseUrl);
                try {
                    const input = page.getByTestId('new-session-composer-input');
                    const menu = page.getByTestId('agent-input-action-menu-button');
                    const submit = page.getByTestId('new-session-composer-send');
                    await expect(input).toBeVisible();
                    await expect(menu).toBeVisible();
                    await expect(submit).toBeVisible();
                    await expect(input).toBeInViewport({ ratio: 1 });
                    await expect(menu).toBeInViewport({ ratio: 1 });
                    await expect(submit).toBeInViewport({ ratio: 1 });
                    await expect(page.getByTestId('agent-input-path-chip')).toHaveCount(0);
                    await expect(page.getByTestId('agent-input-machine-chip')).toBeVisible();
                    await expect(page.getByTestId('agent-input-attachments-chip')).toBeVisible();
                    await expect(page.getByTestId('agent-input-permission-chip')).toHaveCount(0);
                    await input.fill('Improve the input layout without losing my draft.');
                    await expect.poll(() => input.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16 * size.fontScale);
                    await page.screenshot({ path: test.info().outputPath(`composer-${size.width}x${size.height}.png`) });
                    await menu.click();
                    await expect(page.getByTestId('agent-input-action-menu-overlay')).toBeVisible();
                    await page.getByTestId('agent-input-action-menu-item:permission').click();
                    await expect(page.getByTestId('agent-input-content-popover')).toBeVisible();
                    await expect(page.getByTestId('agent-input-content-popover')).toBeInViewport({ ratio: 1 });
                    await page.screenshot({ path: test.info().outputPath(`menu-${size.width}x${size.height}.png`) });
                    await page.keyboard.press('Escape');
                    await expect(input).toHaveValue('Improve the input layout without losing my draft.');
                } catch (error) {
                    throw appendBrowserDiagnostics(error, diagnostics());
                }
            } finally {
                await context.close();
            }
        }
    });

    test('settles the composer height in one step when a large prompt is pasted', async ({ browser }) => {
        test.setTimeout(180_000);
        if (!uiBaseUrl || !authStorageState) throw new Error('missing ui/auth fixtures');

        // Desktop web: the composer is hosted in the centered web modal, where the jank was reported.
        const context = await browser.newContext({
            storageState: authStorageState,
            viewport: { width: 1440, height: 900 },
        });
        try {
            const { page, diagnostics } = await openNewSessionFromSessionsSurface(context, uiBaseUrl);
            try {
                const composer = page.getByTestId('new-session-composer-input');
                await composer.focus();
                await expect.poll(async () => {
                    const inputHeight = await composer.evaluate((input: HTMLTextAreaElement) => input.offsetHeight);
                    const hostHeight = await page.getByTestId('new-session-keyboard-host').evaluate((node) => node.clientHeight);
                    return inputHeight / hostHeight;
                }).toBeGreaterThan(0.5);
                const initialInputHeight = await composer.evaluate((input: HTMLTextAreaElement) => input.offsetHeight);
                const scaffoldHeight = await page.getByTestId('new-session-keyboard-host').evaluate((node) => node.clientHeight);
                await writeFile(test.info().outputPath('composer-geometry.json'), JSON.stringify(await composer.evaluate((input) => {
                    const ancestors = [];
                    for (let node: HTMLElement | null = input; node; node = node.parentElement) {
                        const style = getComputedStyle(node);
                        const bounds = node.getBoundingClientRect();
                        ancestors.push({ testID: node.dataset.testid, tag: node.tagName, height: bounds.height, top: bounds.top, flex: style.flex, maxHeight: style.maxHeight, minHeight: style.minHeight, cssHeight: style.height });
                    }
                    return { viewport: { width: innerWidth, height: innerHeight }, ancestors };
                }), null, 2));
                expect(initialInputHeight).toBeGreaterThan(scaffoldHeight * 0.5);
                await expect(page.getByTestId('agent-input-action-menu-button')).toBeVisible();
                await expect(page.getByTestId('agent-input-path-chip')).toHaveCount(0);

                const largePrompt = Array.from(
                    { length: 300 },
                    (_, index) => `${index + 1}. Handoff step: inspect the owner, write the failing test, then fix it.`,
                ).join('\n');
                const trace = await recordComposerHeightsAcrossPaste(page, largePrompt);
                const tracePath = test.info().outputPath('composer-height-trace.json');
                await writeFile(tracePath, JSON.stringify(trace, null, 2));
                await test.info().attach('composer-height-trace.json', { path: tracePath, contentType: 'application/json' });

                await expect(composer).toHaveValue(largePrompt);
                expect(trace.inputHeights.length).toBeGreaterThan(30);
                expect(trace.inputHeights.at(-1)).toBeGreaterThan(initialInputHeight);
                // Pasting is one input event: the composer must reach its final height in the
                // frame after the paste and stay there, not creep toward it over many frames.
                expect(countHeightChanges(trace.inputHeights)).toBeLessThanOrEqual(1);
                expect(countHeightChanges(trace.panelHeights)).toBeLessThanOrEqual(1);
                expect(countHeightChanges(trace.scaffoldHeights)).toBeLessThanOrEqual(1);
            } catch (error) {
                throw appendBrowserDiagnostics(error, diagnostics());
            }
        } finally {
            await context.close();
        }
    });
});

type AuthStorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

async function openNewSessionFromSessionsSurface(context: BrowserContext, uiBaseUrl: string): Promise<{
    page: Page;
    diagnostics: () => string;
}> {
    const page = await context.newPage();
    const diagnostics = collectBrowserDiagnostics({ page });
    try {
        await gotoDomContentLoadedWithRetries(page, `${uiBaseUrl}/?happier_hmr=0`, 240_000);
        // The entry button can be replaced while the restored session list hydrates.
        await expect(async () => {
            const startNewSession = await waitForVisibleByTestId(page, startNewSessionTestIds, 10_000);
            await startNewSession.click({ timeout: 5_000 });
        }).toPass({ timeout: 120_000 });
        await page.waitForURL((url) => url.pathname.endsWith('/new'), { timeout: 60_000 });
        await expect(page.getByTestId('new-session-composer-input')).toBeVisible({ timeout: 60_000 });
        await expect(page.getByTestId('new-session-keyboard-host')).toBeInViewport({ ratio: 1 });
        return { page, diagnostics };
    } catch (error) {
        throw appendBrowserDiagnostics(error, diagnostics());
    }
}

type ComposerHeightTrace = Readonly<{
    inputHeights: readonly number[];
    panelHeights: readonly number[];
    scaffoldHeights: readonly number[];
}>;

function countHeightChanges(heights: readonly number[]): number {
    let changes = 0;
    for (let index = 1; index < heights.length; index += 1) {
        if (heights[index] !== heights[index - 1]) changes += 1;
    }
    return changes;
}

async function recordComposerHeightsAcrossPaste(page: Page, text: string): Promise<ComposerHeightTrace> {
    await page.evaluate(() => {
        const input = document.querySelector<HTMLElement>('[data-testid="new-session-composer-input"]');
        const panel = document.querySelector<HTMLElement>('[data-testid="agent-input-drop-zone"]');
        const scaffold = document.querySelector<HTMLElement>('[data-testid="new-session-keyboard-host"]');
        if (!input || !panel || !scaffold) throw new Error('composer elements not found');
        const trace = {
            inputHeights: [] as number[],
            panelHeights: [] as number[],
            scaffoldHeights: [] as number[],
            done: false,
        };
        (window as unknown as { __composerHeightTrace: typeof trace }).__composerHeightTrace = trace;
        const sample = () => {
            trace.inputHeights.push(input.offsetHeight);
            trace.panelHeights.push(panel.offsetHeight);
            trace.scaffoldHeights.push(scaffold.offsetHeight);
            if (trace.inputHeights.length >= 120) {
                trace.done = true;
                return;
            }
            requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
    });
    // insertText dispatches a single input event carrying the whole string, like a paste.
    await page.keyboard.insertText(text);
    await page.waitForFunction(
        () => (window as unknown as { __composerHeightTrace?: { done: boolean } }).__composerHeightTrace?.done === true,
        undefined,
        { timeout: 30_000 },
    );
    return page.evaluate(() => {
        const { inputHeights, panelHeights, scaffoldHeights } = (window as unknown as {
            __composerHeightTrace: ComposerHeightTrace;
        }).__composerHeightTrace;
        return { inputHeights, panelHeights, scaffoldHeights };
    });
}
