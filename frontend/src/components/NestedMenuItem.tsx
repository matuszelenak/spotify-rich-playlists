import React, {useState, useRef, useImperativeHandle} from 'react';
import Menu from '@mui/material/Menu';
import {MenuProps} from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {MenuItemProps} from '@mui/material/MenuItem';
import ArrowRight from '@mui/icons-material/ArrowRight';

export interface NestedMenuItemProps extends Omit<MenuItemProps, 'button'> {
    parentMenuOpen: boolean
    component?: React.ElementType
    label?: React.ReactNode
    rightIcon?: React.ReactNode
    ContainerProps?: React.HTMLAttributes<HTMLElement> &
        React.RefAttributes<HTMLElement | null>
    MenuProps?: Omit<MenuProps, 'children'>
    button?: true | undefined
}

const NestedMenuItem = React.forwardRef<
    HTMLLIElement | null,
    NestedMenuItemProps
>(function NestedMenuItem(props, ref) {
    const {
        parentMenuOpen,
        component = 'div',
        label,
        rightIcon = <ArrowRight/>,
        children,
        className,
        tabIndex: tabIndexProp,
        MenuProps = {},
        ContainerProps: ContainerPropsProp = {},
        ...MenuItemProps
    } = props

    const {ref: containerRefProp, ...ContainerProps} = ContainerPropsProp

    const menuItemRef = useRef<HTMLLIElement>(null)
    useImperativeHandle(ref, () => menuItemRef.current)

    const containerRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(containerRefProp, () => containerRef.current)

    const menuContainerRef = useRef<HTMLDivElement>(null)

    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false)

    const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
        setIsSubMenuOpen(true)

        if (ContainerProps?.onMouseEnter) {
            ContainerProps.onMouseEnter(event)
        }
    }
    const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
        setIsSubMenuOpen(false)

        if (ContainerProps?.onMouseLeave) {
            ContainerProps.onMouseLeave(event)
        }
    }

    // Check if any immediate children are active
    const isSubmenuFocused = () => {
        const active = containerRef.current?.ownerDocument?.activeElement
        for (const child of menuContainerRef.current?.children ?? []) {
            if (child === active) {
                return true
            }
        }
        return false
    }

    const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
        if (event.target === containerRef.current) {
            setIsSubMenuOpen(true)
        }

        if (ContainerProps?.onFocus) {
            ContainerProps.onFocus(event)
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            return
        }

        if (isSubmenuFocused()) {
            event.stopPropagation()
        }

        const active = containerRef.current?.ownerDocument?.activeElement

        if (event.key === 'ArrowLeft' && isSubmenuFocused()) {
            containerRef.current?.focus()
        }

        if (
            event.key === 'ArrowRight' &&
            event.target === containerRef.current &&
            event.target === active
        ) {
            const firstChild = menuContainerRef.current?.children[0] as
                | HTMLElement
                | undefined
            firstChild?.focus()
        }
    }

    const open = isSubMenuOpen && parentMenuOpen

    // Root element must have a `tabIndex` attribute for keyboard navigation
    let tabIndex
    if (!props.disabled) {
        tabIndex = tabIndexProp !== undefined ? tabIndexProp : -1
    }

    return (
        <div
            {...ContainerProps}
            ref={containerRef}
            onFocus={handleFocus}
            tabIndex={tabIndex}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
        >
            <MenuItem
                {...MenuItemProps}
                ref={menuItemRef}
            >
                {label}
                {rightIcon}
            </MenuItem>
            <Menu
                // Set pointer events to 'none' to prevent the invisible Popover div
                // from capturing events for clicks and hovers
                style={{pointerEvents: 'none'}}
                anchorEl={menuItemRef.current}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                }}
                open={open}
                autoFocus={false}
                disableAutoFocus
                disableEnforceFocus
                onClose={() => {
                    setIsSubMenuOpen(false)
                }}
            >
                <div ref={menuContainerRef} style={{pointerEvents: 'auto'}}>
                    {children}
                </div>
            </Menu>
        </div>
    )
})

export default NestedMenuItem