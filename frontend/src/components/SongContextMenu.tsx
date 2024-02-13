import { Menu, MenuItem } from "@mui/material";
import NestedMenuItem from "./NestedMenuItem";
import React, { useState } from "react";

export type MenuItemDef = {
    label: string
    action: () => any
    items: Array<MenuItemDef>
}

export type SongContextMenuProps = {
    children: any
    items: Array<MenuItemDef>
}

export type MyMenuItemProps = {
    itemData: MenuItemDef
    isOpen: boolean
    defaultHandler: () => any
}


const MyMenuItem = ({itemData, isOpen, defaultHandler}: MyMenuItemProps) => {
    if (itemData.items.length > 0) {
        return (
            <NestedMenuItem parentMenuOpen={isOpen} label={itemData.label}>
                {itemData.items.map((item, index) => (
                    <MyMenuItem itemData={item} isOpen={isOpen} defaultHandler={defaultHandler} key={index}/>
                ))}
            </NestedMenuItem>
        )
    }

    return (
        <MenuItem onClick={() => {
            const result = itemData.action()
            defaultHandler()
            return result
        }}>
            <>{itemData.label}</>
        </MenuItem>
    )
}

export const SongContextMenu = (props: SongContextMenuProps) => {
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; } | null>(null);

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                } : null,
        );
    };

    const handleClose = () => {
        setContextMenu(null);
    };

    return (
        <div onContextMenu={handleContextMenu}>
            <Menu
                open={contextMenu !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
                        : undefined
                }
            >
                {props.items.map((item, index) =>
                    <MyMenuItem itemData={item} isOpen={!!contextMenu} defaultHandler={handleClose} key={index}/>
                )}
            </Menu>
            {props.children}
        </div>
    )
}
