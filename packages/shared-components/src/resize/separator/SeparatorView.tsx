/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React from "react";
import { Separator } from "react-resizable-panels";
import CollapseIcon from "@vector-im/compound-design-tokens/assets/web/icons/collapse";
import classNames from "classnames";

import { type ViewModel, useViewModel } from "../../core/viewmodel";
import styles from "./SeparatorView.module.css";
import { type ResizerViewSnapshot } from "..";
import { useI18n } from "../../core/i18n/i18nContext";

export interface SeparatorViewActions {
    onSeparatorClick: () => void;
    onSeparatorPointerDown: () => void;
    onFocus: () => void;
    onBlur: () => void;
}

interface Props {
    vm: ViewModel<ResizerViewSnapshot, SeparatorViewActions>;
    className?: string;
}

/**
 * Custom separator for the collapsible left-panel.
 * Always visible; clicking (without dragging) toggles mini-collapse.
 */
export function SeparatorView({ vm, className }: Props): React.ReactNode {
    const { translate: _t } = useI18n();
    const { isMiniCollapsed, isFocusedViaKeyboard } = useViewModel(vm);

    return (
        <Separator
            className={classNames(styles.separator, className, {
                [styles.focused]: isFocusedViaKeyboard,
            })}
            disableDoubleClick
            onClick={vm.onSeparatorClick}
            onPointerDown={vm.onSeparatorPointerDown}
            onFocus={vm.onFocus}
            onBlur={vm.onBlur}
            aria-label={_t("left_panel|separator_label")}
        >
            <CollapseIcon
                width="10px"
                height="10px"
                className={classNames(styles.collapseIcon, {
                    [styles.collapseIconFlipped]: isMiniCollapsed,
                })}
                aria-hidden
            />
        </Separator>
    );
}
