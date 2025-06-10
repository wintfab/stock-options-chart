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
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
} from "@fluentui/react-components";
import { Filter24Regular, CalendarWeekStart24Regular, CalendarMonth24Regular, Warning20Regular } from "@fluentui/react-icons";

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
    {
        value: "warning",
        label: "At Risk",
        icon: <Warning20Regular />,
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
                Contracts Analysis
            </Title3>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <>
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
                                style={{ color: "white", marginRight: 16, display: "flex", alignItems: "center", gap: 8 }}
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
                    <Dialog>
                        <DialogTrigger disableButtonEnhancement>
                            <Button
                                appearance="subtle"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 6H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                }
                                style={{ color: "white", marginRight: 32 }}
                                disabled={disabled}
                                onMouseEnter={e => (e.currentTarget.style.color = "#323130")}
                                onMouseLeave={e => (e.currentTarget.style.color = "white")}
                                aria-label="Clear Cache"
                            />
                        </DialogTrigger>
                        <DialogSurface>
                            <DialogBody>
                                <DialogTitle>Clear Cache?</DialogTitle>
                                <div>This will clear all cached data and reload the page. Are you sure you want to continue?</div>
                                <DialogActions>
                                    <DialogTrigger disableButtonEnhancement>
                                        <Button appearance="secondary">Cancel</Button>
                                    </DialogTrigger>
                                    <Button 
                                        appearance="primary"
                                        onClick={() => {
                                            localStorage.clear();
                                            window.location.reload();
                                        }}
                                    >
                                        Clear Cache
                                    </Button>
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                </>
            </div>
        </header>
    );
};

export default OfficeHeader;
