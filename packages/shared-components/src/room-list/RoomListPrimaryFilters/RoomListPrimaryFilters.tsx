/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React, { type JSX, memo, useId, useState } from "react";
import { ChatFilter, CheckboxMenuItem, IconButton, Menu } from "@vector-im/compound-web";
import ChevronDownIcon from "@vector-im/compound-design-tokens/assets/web/icons/chevron-down";
import FilterIcon from "@vector-im/compound-design-tokens/assets/web/icons/filter";

import { Flex } from "../../core/utils/Flex";
import { _t } from "../../core/i18n/i18n";
import { useCollapseFilters } from "./useCollapseFilters";
import { useVisibleFilters, type FilterId } from "./useVisibleFilters";
import styles from "./RoomListPrimaryFilters.module.css";

const filterIdToLabel = (filterId: FilterId): string => {
    switch (filterId) {
        case "unread":
            return _t("room_list|filters|unread");
        case "people":
            return _t("room_list|filters|people");
        case "rooms":
            return _t("room_list|filters|rooms");
        case "favourite":
            return _t("room_list|filters|favourite");
        case "mentions":
            return _t("room_list|filters|mentions");
        case "invites":
            return _t("room_list|filters|invites");
        case "low_priority":
            return _t("room_list|filters|low_priority");
    }
};

export interface RoomListPrimaryFiltersProps {
    filterIds: FilterId[];
    activeFilterId?: FilterId;
    onToggleFilter: (filterId: FilterId) => void;
}

interface FilterBubbleProps {
    filterIds: FilterId[];
    activeFilterId?: FilterId;
    onToggleFilter: (filterId: FilterId) => void;
}

/** Single-button dropdown that collapses all filter pills when the panel is too narrow. */
function FilterBubble({ filterIds, activeFilterId, onToggleFilter }: FilterBubbleProps): JSX.Element {
    const [open, setOpen] = useState(false);
    const hasActive = activeFilterId !== undefined;

    return (
        <Menu
            open={open}
            onOpenChange={setOpen}
            title={_t("room_list|primary_filters")}
            showTitle={false}
            align="start"
            trigger={
                <ChatFilter selected={hasActive} aria-label={_t("room_list|primary_filters")}>
                    <FilterIcon width="16px" height="16px" aria-hidden />
                </ChatFilter>
            }
        >
            {filterIds.map((filterId) => (
                <CheckboxMenuItem
                    key={filterId}
                    label={filterIdToLabel(filterId)}
                    checked={filterId === activeFilterId}
                    onSelect={() => onToggleFilter(filterId)}
                />
            ))}
        </Menu>
    );
}

export const RoomListPrimaryFilters = memo(function RoomListPrimaryFilters({
    filterIds,
    activeFilterId,
    onToggleFilter,
}: RoomListPrimaryFiltersProps): JSX.Element | null {
    const id = useId();
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        ref,
        isWrapping: displayChevron,
        wrappingIndex,
    } = useCollapseFilters<HTMLDivElement>(isExpanded, "wrapping");
    const visibleFilterIds = useVisibleFilters(filterIds, activeFilterId, wrappingIndex);

    return (
        <div className={styles.filterContainer} data-testid="primary-filters">
            <div className={styles.filterBubble}>
                <FilterBubble
                    filterIds={filterIds}
                    activeFilterId={activeFilterId}
                    onToggleFilter={onToggleFilter}
                />
            </div>

            <Flex
                className={styles.roomListPrimaryFilters}
                gap="var(--cpd-space-3x)"
                direction="row-reverse"
                justify="space-between"
            >
                {displayChevron && (
                    <IconButton
                        kind="secondary"
                        aria-expanded={isExpanded}
                        aria-controls={id}
                        className={styles.iconButton}
                        aria-label={isExpanded ? _t("room_list|collapse_filters") : _t("room_list|expand_filters")}
                        size="28px"
                        onClick={() => setIsExpanded((expanded) => !expanded)}
                    >
                        <ChevronDownIcon />
                    </IconButton>
                )}
                <Flex
                    id={id}
                    as="div"
                    role="listbox"
                    aria-label={_t("room_list|primary_filters")}
                    align="center"
                    gap="var(--cpd-space-2x)"
                    wrap="wrap"
                    className={styles.list}
                    ref={ref}
                >
                    {visibleFilterIds.map((filterId, index) => (
                        <ChatFilter
                            key={`${filterId}-${index}`}
                            role="option"
                            selected={filterId === activeFilterId}
                            onClick={() => onToggleFilter(filterId)}
                        >
                            {filterIdToLabel(filterId)}
                        </ChatFilter>
                    ))}
                </Flex>
            </Flex>
        </div>
    );
});
