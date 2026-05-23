/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import {
    BaseViewModel,
    type LeftResizablePanelViewActions,
    type SeparatorViewActions,
    type PanelSize,
    type PanelImperativeHandle,
    type GroupViewActions,
    type ResizerViewSnapshot,
} from "@element-hq/web-shared-components";
import whatInput from "what-input";

import SettingsStore from "../../settings/SettingsStore";
import { SettingLevel } from "../../settings/SettingLevel";

const MINI_COLLAPSED_PX = 56;
const MINI_COLLAPSED_WIDTH = `${MINI_COLLAPSED_PX}px`;
const MINI_THRESHOLD_PX = 150;

function getInitialState(): ResizerViewSnapshot {
    if (SettingsStore.getValue("RoomList.isPanelCollapsed")) {
        return {
            isCollapsed: true,
            isMiniCollapsed: false,
            initialSize: 0,
            isFocusedViaKeyboard: false,
        };
    }
    const isMiniCollapsed = SettingsStore.getValue("RoomList.isPanelMiniCollapsed");
    return {
        isCollapsed: false,
        isMiniCollapsed,
        initialSize: isMiniCollapsed ? undefined : (SettingsStore.getValue("RoomList.panelSize") ?? undefined),
        isFocusedViaKeyboard: false,
    };
}

/**
 * Viewmodel that drives the resizable left panel.
 */
export class ResizerViewModel
    extends BaseViewModel<ResizerViewSnapshot, void>
    implements SeparatorViewActions, LeftResizablePanelViewActions, GroupViewActions
{
    private panelHandle?: PanelImperativeHandle;

    /** Last known pixel width of the panel, updated on every resize event. */
    private lastKnownPixelSize = 0;

    /**
     * True once the first onResize event has been received.
     * onLayoutChanged fires during mount (before the first onResize), so we guard
     * against running snap logic with a stale lastKnownPixelSize of 0.
     */
    private hasReceivedFirstResize = false;

    /**
     * True while the user's pointer is down on the separator. Set synchronously on
     * pointerdown; cleared as a microtask on pointerup so it becomes false AFTER the
     * library's synchronous onLayoutChanged call (capture-phase pointerup handler) but
     * BEFORE the setTimeout(0) macrotask queued by onLeftPanelResized.
     */
    private isDragging = false;

    /** Set once a pointermove fires after pointerdown so click-on-drag-release is swallowed. */
    private wasDragging = false;

    /** Pending snap timeout. Cancelled and re-queued on every layout tick during drag. */
    private snapTimeout?: ReturnType<typeof setTimeout>;

    /** Timestamp of the last separator click, used to swallow the second click of a double-click. */
    private lastClickTime = 0;

    public constructor() {
        super(undefined, getInitialState());
    }

    public onLeftPanelResize = (panelSize: PanelSize): void => {
        this.hasReceivedFirstResize = true;
        const newSize = panelSize.inPixels;
        this.lastKnownPixelSize = newSize;
        const updates: Partial<ResizerViewSnapshot> = { isCollapsed: newSize === 0 };
        if (this.snapshot.current.isMiniCollapsed && newSize >= MINI_THRESHOLD_PX) {
            updates.isMiniCollapsed = false;
        }
        this.snapshot.merge(updates);
    };

    public toggleMiniCollapsed = (): void => {
        const willBeMini = this.lastKnownPixelSize > MINI_THRESHOLD_PX;
        this.snapshot.merge({ isMiniCollapsed: willBeMini });
        SettingsStore.setValue("RoomList.isPanelMiniCollapsed", null, SettingLevel.DEVICE, willBeMini);
        if (willBeMini) {
            this.panelHandle?.resize(MINI_COLLAPSED_WIDTH);
        } else {
            const lastSize = SettingsStore.getValue("RoomList.panelSize");
            this.panelHandle?.resize(`${lastSize ?? 100}%`);
        }
    };

    public onSeparatorPointerDown = (): void => {
        this.wasDragging = false;
        this.isDragging = true;

        const onMove = (): void => {
            this.wasDragging = true;
        };
        window.addEventListener("pointermove", onMove, { once: true });

        window.addEventListener(
            "pointerup",
            () => {
                window.removeEventListener("pointermove", onMove);
                // Clear isDragging as a microtask. Event loop order on pointerup:
                //   1. Library capture handler → onLayoutChanged → onLeftPanelResized → setTimeout(0) queued (isDragging=true, will bail)
                //   2. Our bubble handler → microtask: isDragging=false
                //   3. click event
                //   4. setTimeout(0) macrotask → isDragging=false → snap runs
                void Promise.resolve().then(() => {
                    this.isDragging = false;
                });
            },
            { once: true },
        );
    };

    public onLeftPanelResized = (newSize: number): void => {
        if (!this.hasReceivedFirstResize) return;

        // Round fractional percentages to avoid blurry sub-pixel widths.
        if (!Number.isInteger(newSize)) {
            this.panelHandle?.resize(`${Math.round(newSize)}%`);
            return;
        }

        // Cancel any pending snap and re-queue. During drag this timeout fires and bails
        // (isDragging=true). On the final layout tick after drag ends the microtask has
        // already cleared isDragging, so the timeout actually commits the snap.
        clearTimeout(this.snapTimeout);
        const savedNewSize = newSize;
        this.snapTimeout = setTimeout(() => {
            if (this.isDragging) return;

            const px = this.lastKnownPixelSize;

            if (px === 0) {
                this.snapshot.merge({ isCollapsed: true, isMiniCollapsed: false });
                SettingsStore.setValue("RoomList.isPanelCollapsed", null, SettingLevel.DEVICE, true);
                SettingsStore.setValue("RoomList.isPanelMiniCollapsed", null, SettingLevel.DEVICE, false);
                return;
            }

            if (px < MINI_THRESHOLD_PX) {
                this.snapshot.merge({ isCollapsed: false, isMiniCollapsed: true });
                SettingsStore.setValue("RoomList.isPanelCollapsed", null, SettingLevel.DEVICE, false);
                SettingsStore.setValue("RoomList.isPanelMiniCollapsed", null, SettingLevel.DEVICE, true);
                if (Math.abs(px - MINI_COLLAPSED_PX) > 5) {
                    this.panelHandle?.resize(MINI_COLLAPSED_WIDTH);
                }
                return;
            }

            this.snapshot.merge({ isCollapsed: false, isMiniCollapsed: false });
            SettingsStore.setValue("RoomList.isPanelCollapsed", null, SettingLevel.DEVICE, false);
            SettingsStore.setValue("RoomList.isPanelMiniCollapsed", null, SettingLevel.DEVICE, false);
            SettingsStore.setValue("RoomList.panelSize", null, SettingLevel.DEVICE, savedNewSize);
        }, 0);
    };

    public setPanelHandle = (handle: PanelImperativeHandle): void => {
        this.panelHandle = handle;
        if (this.snapshot.current.isMiniCollapsed) {
            handle.resize(MINI_COLLAPSED_WIDTH);
        }
    };

    public onSeparatorClick = (): void => {
        // Swallow click events that are the tail of a drag gesture.
        if (this.wasDragging) {
            this.wasDragging = false;
            return;
        }
        // Swallow the second synthetic click that fires on a double-click (300 ms window).
        const now = Date.now();
        if (now - this.lastClickTime < 300) return;
        this.lastClickTime = now;

        if (this.panelHandle?.isCollapsed()) {
            const lastSize = SettingsStore.getValue("RoomList.panelSize");
            this.panelHandle.resize(`${lastSize ?? 100}%`);
        } else {
            this.toggleMiniCollapsed();
        }
    };

    public onFocus = (): void => {
        /**
         * The intention here is to make the separator visible when it is focused by keyboard
         * navigation i.e tabbing through the app.
         *
         * There's a good reason to take this approach instead of just relying on the focus-visible
         * selector:
         * When exactly an element gets focus-visible is determined by browser heuristics and usually
         * interacting with the mouse will not give an element focus-visible.
         * However with this separator on chrome, mouse interaction occasionally gives it focus-visible.
         * The leads to flakey separator behaviour.
         */
        const currentNavigation = whatInput.ask();
        if (currentNavigation === "keyboard") {
            this.snapshot.merge({ isFocusedViaKeyboard: true });
        }
    };

    public onBlur = (): void => {
        this.snapshot.merge({ isFocusedViaKeyboard: false });
    };
}
