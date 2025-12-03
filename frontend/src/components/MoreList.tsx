import React, {ReactNode, useState, useRef, useEffect, RefObject} from "react";
import {
    Box,
    Card,
    List,
    ListItemButton,
    Portal,
    Tooltip,
    Typography
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {useTheme} from "@mui/material/styles";

export interface MoreListAction {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
}

export interface MoreListProps {
    position?: 'relative' | 'absolute';
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    zIndex?: number;

    noSmallBg?: boolean;
    backgroundColor?: any;
    color?: any;
    icon?: any;
    arrow?: boolean;

    expanded?: boolean;
    onHover?: (open: boolean) => void;
    onClick?: () => void;
    actions: MoreListAction[];
    listAfter?: number;
    baseIconSize?: number;
    baseGap?: number;
    hoverCardPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    containerRef: RefObject<HTMLDivElement>;
}


/* ----------------------------------------------------------
    Hook: calculate card position relative to MoreButton
---------------------------------------------------------- */
function useHoverCardPosition(position: MoreListProps["hoverCardPosition"]) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [cardPos, setCardPos] = useState({top: 0, left: 0});

    const update = (cardW = 150, cardH = 300) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top = 0;
        let left = 0;

        switch (position) {
            case "top-left":
                top = rect.top - cardH;
                left = rect.left;
                break;
            case "top-right":
                top = rect.top - cardH;
                left = rect.right - cardW;
                break;
            case "bottom-right":
                top = rect.bottom;
                left = rect.right - cardW;
                break;
            case "center":
                top = rect.bottom;
                left = rect.left + rect.width / 2 - cardW / 2;
                break;
            case "bottom-left":
            default:
                top = rect.bottom;
                left = rect.left;
                break;
        }

        // vertical auto-flip + clamp
        if (top + cardH > vh) top = rect.top - cardH;
        if (top < 0) top = 4;

        // horizontal clamp
        left = Math.max(4, Math.min(left, vw - cardW - 4));

        // IMPORTANT: no scroll offsets for `position: fixed`
        setCardPos({top, left});
    };

    return {buttonRef, cardPos, update};
}

/* ----------------------------------------------------------
                MAIN COMPONENT
---------------------------------------------------------- */
const MoreList: React.FC<MoreListProps> = ({
                                               position = 'relative',
                                               top = null,
                                               left = null,
                                               right = null,
                                               bottom = null,
                                               zIndex = null,

                                               noSmallBg = false,
                                               backgroundColor,
                                               color,
                                               icon = <MoreHorizIcon/>,
                                               arrow = false,

                                               expanded = false,
                                               onHover = () => {
                                               },
                                               onClick = () => {
                                               },
                                               actions,
                                               listAfter,
                                               baseIconSize = 1,
                                               baseGap = 1,
                                               hoverCardPosition = "bottom-left",
                                               containerRef
                                           }) => {
    const theme = useTheme();
    backgroundColor = backgroundColor ?? theme.palette.action.hover;
    color = color ?? theme.palette.primary.main;

    const iconSize = baseIconSize * 30;
    const gap = baseGap * 6;

    const {buttonRef, cardPos, update} = useHoverCardPosition(hoverCardPosition);

    const [calculatedMaxVisible, setCalculatedMaxVisible] = useState(listAfter ?? 0);
    const actualMaxVisible =
        expanded ?
            (listAfter < calculatedMaxVisible - 1) ?
                listAfter
                :
                calculatedMaxVisible - 1
            : 0;
    const visibleActions = actions.slice(0, actualMaxVisible);
    const hiddenActions = expanded ? actions.slice(actualMaxVisible) : actions;
    const showMoreButton = actions.length > actualMaxVisible;

    // Layout sizing for container
    const totalIcons = expanded && hiddenActions.length > 0 ? visibleActions.length + 1 : expanded ? visibleActions.length : 1;
    const containerWidth = totalIcons * iconSize + (totalIcons + 1) * gap;
    const containerHeight = iconSize + 2 * gap;

    useEffect(() => {
        if (!containerRef?.current) return;
        const container = containerRef.current;

        const updateMaxVisible = () => {
            const container = containerRef.current;
            if (!container) return;

            // Save current styles
            const prevFlex = container.style.flex;
            const prevWidth = container.style.width;

            // TEMP: allow max expansion
            container.style.flex = "1 1 auto";
            container.style.width = "auto";

            // Force layout flush
            const maxPossible = container.getBoundingClientRect().width;

            // Restore previous styles
            container.style.flex = prevFlex;
            container.style.width = prevWidth;

            // Calculate icon count
            const iconWithGap = baseIconSize * 30 + baseGap * 6;
            const newMax = Math.floor(maxPossible / iconWithGap);

            setCalculatedMaxVisible(newMax);
        };

        // Observe container size
        const observer = new ResizeObserver(() => {
            updateMaxVisible();
        });
        observer.observe(container);

        // Listen to window resize
        window.addEventListener("resize", updateMaxVisible);

        // Initial calculation
        requestAnimationFrame(() => updateMaxVisible());

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateMaxVisible);
        };
    }, [containerRef, baseIconSize, baseGap]);

    // Hover dropdown card logic
    const rootRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const [hover, setHover] = useState(false);
    const hoverTimeout = useRef<number | null>(null);
    const hoverCardTimeout = useRef<number | null>(null);


    const handleMouseEnter = () => {
        if (hoverCardTimeout.current) clearTimeout(hoverCardTimeout.current); // Clear any existing timeout
        handleEnter()
        update(); // Update card position
        setHover(true); // Set hover state to true
    };
    const handleMouseLeave = () => {
        if (hoverCardTimeout.current) clearTimeout(hoverCardTimeout.current);
        hoverCardTimeout.current = setTimeout(() => {
            setHover(false); // Ensure hover state is updated
        }, 400);

    };

    const handleEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        onHover?.(true);
    };

    const handleLeave = (e: MouseEvent) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        if (hoverCardTimeout.current) clearTimeout(hoverCardTimeout.current);

        const related = e.relatedTarget as Node | null;

        // If the mouse leaves both rootRef and cardRef, close the card
        if (
            !cardRef.current?.contains(related) || // Case when leaving both root and card
            !rootRef.current?.contains(related)  // Case when leaving rootRef only
        ) {

            hoverCardTimeout.current = setTimeout(() => {
                setHover(false); // Ensure hover state is updated
            }, 400);
            hoverTimeout.current = setTimeout(() => {
                onHover?.(false);
            }, 1000); // Delay before closing (optional, for smoother transition)
        }
    };


    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        el.addEventListener("mouseenter", handleEnter);
        el.addEventListener("mouseleave", handleLeave);

        return () => {
            el.removeEventListener("mouseenter", handleEnter);
            el.removeEventListener("mouseleave", handleLeave);
        };
    }, [onHover]);

    return (
        <Box
            ref={rootRef}
            sx={{
                position: position,
                top: top,
                left: left,
                right: right,
                bottom: bottom,
                zIndex: zIndex,
            }}
        >

        {/* Icon Container */}
            <Box
                sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    height: containerHeight,
                    width: containerWidth,
                    flexGrow: 1,
                    borderRadius: 100,
                    backgroundColor: expanded ? `${backgroundColor}` : !noSmallBg ? `${backgroundColor}` : undefined,
                    backdropFilter: expanded ? "blur(4px)" : "blur(1px)",

                    transition: "all 600ms ease",
                    boxShadow: expanded ? `0 0 0px ${color}, inset 0 0 3px ${color}95` : noSmallBg ? `0 0 0px ${color}, inset 0 0 0px ${color}55` : undefined,
                    boxSizing: "border-box", // keeps content in place

                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center", // center horizontally
                        gap: `${gap}px`,
                        height: "100%",
                        width: "100%",
                    }}
                >
                    {visibleActions.map((action, idx) => (
                        <Tooltip
                            title={action.label}
                            arrow={arrow}
                            slotProps={{
                                arrow: {
                                    sx: {
                                        color: `${backgroundColor}`,
                                    }
                                },
                                tooltip: {
                                    sx: {
                                        backgroundColor: `${backgroundColor}`,
                                        backdropFilter: "blur(4px)",
                                        color: color,
                                        borderRadius: 5,
                                        boxShadow: `0 0 0px ${color}75, inset 0 0 1px ${color}75`,
                                    }
                                }
                            }}
                        >

                            <Box
                                onClick={action.onClick}
                                sx={{
                                    width: iconSize,
                                    height: iconSize,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    //boxShadow: `0 0 0px ${color}, inset 0 0 3px ${color}75`,
                                    color: color,
                                    boxSizing: "border-box",
                                    opacity: 0.8,

                                    // Hover → slightly bigger
                                    "&:hover": {
                                        transform: "scale(1.2)",             // scale on hover
                                        boxShadow: `0 0 0px ${color}, inset 0 0 3px ${color}75`,
                                        backgroundColor: backgroundColor,
                                        opacity: 1,

                                    },
                                    // Click (active) → slightly smaller
                                    "&:active": {
                                        transform: "scale(0.93)",   // feels like a physical button
                                        boxShadow: `0 0 5px ${color}, inset 0 0 3px ${color}75`,

                                    },
                                    transition: 'all 200ms ease'

                                }}
                            >
                                {action.icon}
                            </Box>
                        </Tooltip>
                    ))}

                    {/* More Button */}
                    {showMoreButton && (
                        <Box
                            ref={buttonRef}
                            onClick={
                                listAfter === 0 ?
                                    () => {
                                        setHover(false)
                                        onClick()
                                    }
                                    :
                                    () => {
                                    }
                            }
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            sx={{
                                width: iconSize,
                                height: iconSize,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: color,
                                opacity: 0.8,

                                backgroundColor: "",
                                boxSizing: "border-box",
                                // Hover → slightly bigger
                                "&:hover": {
                                    // transform: "scale(1.2)",             // scale on hover
                                    // boxShadow: `0 0 0px ${color}, inset 0 0 3px ${color}75`,
                                    // backgroundColor: backgroundColor,
                                    opacity: 1,

                                },
                                // Click (active) → slightly smaller
                                "&:active": {
                                    // transform: "scale(0.93)",   // feels like a physical button
                                    // boxShadow: `0 0 5px ${color}, inset 0 0 3px ${color}75`,

                                },
                                transition: 'all 200ms ease'
                            }}
                        >
                            {expanded && listAfter !== 0 ? <MoreHorizIcon/> : icon}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Hover dropdown card */}
            {hover && (
                <Portal>

                    <Card
                        ref={cardRef}
                        sx={{
                            position: "fixed",
                            top: cardPos.top + (2 * gap),
                            left: cardPos.left,
                            maxHeight: 300,
                            width: 250,
                            flex: "1 0 auto",
                            overflowY: "auto",
                            transformOrigin: "top",
                            transform: hover ? "scaleY(1)" : "scaleY(0)",
                            opacity: hover ? 1 : 0,
                            transition: "all 800ms ease",
                            pointerEvents: hover ? "auto" : "none",
                            zIndex: 50,
                            color: `${color}`,
                            backgroundColor: `${theme.palette.background.default}`,
                            borderRadius: 3,
                            boxShadow: `0 0 0px ${backgroundColor}, inset 0 0 5px ${backgroundColor}`,


                        }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleLeave}
                    >
                        <Box
                            sx={{
                                backgroundColor: `${backgroundColor}`,
                            }}
                        >
                            <List>
                                {hiddenActions.map((action, idx) => (
                                    <ListItemButton
                                        key={action.label} // must be unique
                                        onClick={action.onClick}
                                        sx={{
                                            cursor: "pointer",
                                            pt: 0.5,
                                            pb: 0.5,
                                            pl: 0,
                                            pr: 0,
                                            boxShadow: `0 0 0px ${backgroundColor}, inset 0 0 5px ${backgroundColor}`,


                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: "20%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                pl: 1,
                                            }}
                                        >
                                            {action.icon}
                                        </Box>
                                        <Typography
                                            variant={"body2"}
                                            sx={{
                                                width: "80%",
                                                pl: 1,
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            {action.label}
                                        </Typography>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Box>
                    </Card>
                </Portal>
            )}
        </Box>
    );
};

export default MoreList;

