/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import { createContext, useContext } from "react";

export interface RoomListMiniContextValue {
    /** Whether the room list is in mini (avatar-only) mode. */
    isMiniCollapsed: boolean;
    /** Toggle the mini-collapsed state. */
    onToggleMiniCollapsed: () => void;
}

export const RoomListMiniContext = createContext<RoomListMiniContextValue>({
    isMiniCollapsed: false,
    onToggleMiniCollapsed: () => {},
});

export const useRoomListMini = (): RoomListMiniContextValue => useContext(RoomListMiniContext);
