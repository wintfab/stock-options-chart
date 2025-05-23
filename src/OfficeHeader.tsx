// Copyright (c) 2025 fwinter. All rights reserved.

import React from "react";
import { Title3 } from "@fluentui/react-components";
import {
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItemRadio,
    Button,
} from "@fluentui/react-components";
import { Filter24Regular, CalendarWeekStart24Regular, CalendarMonth24Regular } from "@fluentui/react-icons";

interface OfficeHeaderProps {
    filter: string;
    setFilter: (value: string) => void;
    disabled?: boolean;
}

const filterOptions = [
    {
        value: "none",
        label: "No Filter",
        icon: <Filter24Regular />,
    },
    {
        value: "week",
        label: "Expiring this week",
        icon: <CalendarWeekStart24Regular />,
    },
    {
        value: "month",
        label: "Expiring this month",
        icon: <CalendarMonth24Regular />,
    },
];

const OfficeHeader: React.FC<OfficeHeaderProps> = ({ filter, setFilter, disabled }) => {
    const selectedOption = filterOptions.find(opt => opt.value === filter) || filterOptions[0];
    return (
        <header className="office-header">
            <img src="/vite.svg" alt="App Logo" style={{ height: 32 }} />
            <div style={{ flex: 1 }} />
            <Title3
                as="h1"
                style={{
                    color: "white",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    margin: 0,
                    flex: "0 1 auto",
                    position: "absolute",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    pointerEvents: "none",
                }}
            >
                Stock Options Analysis
            </Title3>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <Menu
                    checkedValues={{ filter: [filter] }}
                    onCheckedValueChange={(_, { name, checkedItems }) => {
                        if (name === "filter" && checkedItems.length > 0) {
                            setFilter(checkedItems[0]);
                        }
                    }}
                >
                    <MenuTrigger disableButtonEnhancement>
                        <Button
                            appearance="subtle"
                            style={{ color: "white", marginRight: 32, display: "flex", alignItems: "center", gap: 8 }}
                            aria-label="Filter contracts"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            tabIndex={0}
                            disabled={disabled}
                            onMouseEnter={e => (e.currentTarget.style.color = "#323130")}
                            onMouseLeave={e => (e.currentTarget.style.color = "white")}
                        >
                            {selectedOption.icon}
                            Filter
                        </Button>
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            {filterOptions.map(opt => (
                                <MenuItemRadio
                                    key={opt.value}
                                    name="filter"
                                    value={opt.value}
                                    icon={opt.icon}
                                >
                                    {opt.label}
                                </MenuItemRadio>
                            ))}
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </header>
    );
};

export default OfficeHeader;
