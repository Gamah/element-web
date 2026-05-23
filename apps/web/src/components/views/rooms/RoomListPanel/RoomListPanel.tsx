/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useState, useCallback } from "react";
import classNames from "classnames";
import { Flex, RoomListHeaderView, useCreateAutoDisposedViewModel, useRoomListMini } from "@element-hq/web-shared-components";

import { shouldShowComponent } from "../../../../customisations/helpers/UIComponents";
import { UIComponent } from "../../../../settings/UIFeature";
import { RoomListSearch } from "./RoomListSearch";
import { RoomListView } from "./RoomListView";
import { _t } from "../../../../languageHandler";
import { getKeyBindingsManager } from "../../../../KeyBindingsManager";
import { KeyBindingAction } from "../../../../accessibility/KeyboardShortcuts";
import { Landmark, LandmarkNavigation } from "../../../../accessibility/LandmarkNavigation";
import { type IState as IRovingTabIndexState } from "../../../../accessibility/RovingTabIndex";
import { RoomListHeaderViewModel } from "../../../../viewmodels/room-list/RoomListHeaderViewModel";
import { useMatrixClientContext } from "../../../../contexts/MatrixClientContext";
import SpaceStore from "../../../../stores/spaces/SpaceStore";

type RoomListPanelProps = {
    /**
     * Current active space
     * See {@link RoomListSearch}
     */
    activeSpace: string;
};

/**
 * The panel of the room list
 */
export const RoomListPanel: React.FC<RoomListPanelProps> = ({ activeSpace }) => {
    const displayRoomSearch = shouldShowComponent(UIComponent.FilterContainer);
    const [focusedElement, setFocusedElement] = useState<Element | null>(null);
    const { isMiniCollapsed, onToggleMiniCollapsed } = useRoomListMini();

    const onFocus = useCallback((ev: React.FocusEvent): void => {
        setFocusedElement(ev.target as Element);
    }, []);

    const onBlur = useCallback((): void => {
        setFocusedElement(null);
    }, []);

    const onKeyDown = useCallback(
        (ev: React.KeyboardEvent, state?: IRovingTabIndexState): void => {
            if (isMiniCollapsed) return;
            if (!focusedElement) return;
            const navAction = getKeyBindingsManager().getNavigationAction(ev);
            if (navAction === KeyBindingAction.PreviousLandmark || navAction === KeyBindingAction.NextLandmark) {
                ev.stopPropagation();
                ev.preventDefault();
                LandmarkNavigation.findAndFocusNextLandmark(
                    Landmark.ROOM_SEARCH,
                    navAction === KeyBindingAction.PreviousLandmark,
                );
            }
        },
        [focusedElement, isMiniCollapsed],
    );

    const matrixClient = useMatrixClientContext();
    const vm = useCreateAutoDisposedViewModel(
        () => new RoomListHeaderViewModel({ matrixClient, spaceStore: SpaceStore.instance }),
    );

    return (
        <Flex
            as="nav"
            className={classNames("mx_RoomListPanel", { "mx_RoomListPanel--mini": isMiniCollapsed })}
            direction="column"
            align="stretch"
            aria-label={_t("room_list|list_title")}
            onClick={isMiniCollapsed ? onToggleMiniCollapsed : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
        >
            {!isMiniCollapsed && displayRoomSearch && <RoomListSearch activeSpace={activeSpace} />}
            {!isMiniCollapsed && (
                <Flex align="center" justify="space-between" style={{ paddingRight: "var(--cpd-space-2x)" }}>
                    <RoomListHeaderView vm={vm} />
                </Flex>
            )}
            <RoomListView />
        </Flex>
    );
};
