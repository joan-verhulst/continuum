import { cn } from 'continuum';
import type { CSSProperties, ReactNode } from 'react';
import type { Device } from '../layout';
import macbookBack from './macbook-back.svg';
import macbookFront from './macbook-front.svg';
import phoneCamera from './phone-camera.svg';

/*
 * The devices a screen is shown on, drawn at the screen's own size in CSS px: the MacBook Pro from
 * Pixel Perfect's laptop mockup (two SVGs, the body and bezel behind the display and the notch over
 * it) and the iPhone from MCP Hosted's phone (a CSS bezel with the dynamic island and a status bar).
 * The tablet is the phone's bezel at a tablet's size, without the island.
 */

type Box = { x: number; y: number; width: number; height: number };

type Chrome = {
    /** The whole device, bezel and all. */
    outer: { width: number; height: number };
    /** Where the app is drawn, inside the device. */
    app: Box;
};

/* ---------- MacBook: the Figma frame's coordinates, scaled so the display is 1440 wide ---------- */

const MACBOOK = { width: 1216, height: 735 };
const MACBOOK_DISPLAY = { x: 124.5, y: 18, width: 967, height: 628, radius: 14, notch: 20 };
const MACBOOK_SCALE = 1440 / MACBOOK_DISPLAY.width;

/* ---------- Phone: MCP Hosted's phone, scaled so the screen is 390 wide ---------- */

const PHONE_SCALE = 390 / 361.5;
const phone = {
    bezel: 11,
    screen: { width: 390, height: 844 },
    status: 47,
};

/* ---------- Tablet: the phone's bezel around a 768 by 1024 screen ---------- */

const tablet = {
    bezel: 20,
    screen: { width: 768, height: 1024 },
    status: 24,
};

const desktopDisplay = {
    x: MACBOOK_DISPLAY.x * MACBOOK_SCALE,
    y: MACBOOK_DISPLAY.y * MACBOOK_SCALE,
    width: 1440,
    height: MACBOOK_DISPLAY.height * MACBOOK_SCALE,
};
// The notch's strip is black, as a notched MacBook shows it in full screen; the app starts under it.
const desktopNotch = Math.round(MACBOOK_DISPLAY.notch * MACBOOK_SCALE);

export const chromes: Record<Device, Chrome> = {
    desktop: {
        outer: { width: MACBOOK.width * MACBOOK_SCALE, height: MACBOOK.height * MACBOOK_SCALE },
        app: {
            x: desktopDisplay.x,
            y: desktopDisplay.y + desktopNotch,
            width: 1440,
            height: Math.round(desktopDisplay.height - desktopNotch),
        },
    },
    tablet: {
        outer: {
            width: tablet.screen.width + 2 * tablet.bezel,
            height: tablet.screen.height + 2 * tablet.bezel,
        },
        app: {
            x: tablet.bezel,
            y: tablet.bezel + tablet.status,
            width: tablet.screen.width,
            height: tablet.screen.height - tablet.status,
        },
    },
    phone: {
        outer: {
            width: phone.screen.width + 2 * phone.bezel,
            height: phone.screen.height + 2 * phone.bezel,
        },
        app: {
            x: phone.bezel,
            y: phone.bezel + phone.status,
            width: phone.screen.width,
            height: phone.screen.height - phone.status,
        },
    },
};

const boxStyle = ({ x, y, width, height }: Box): CSSProperties => ({
    left: x,
    top: y,
    width,
    height,
});

/** The app's own box: positioned, so the overlays it holds keep to it. */
const AppBox = ({ device, children }: { device: Device; children: ReactNode }) => (
    <div
        className="absolute isolate overflow-hidden bg-neutral-50"
        style={boxStyle(chromes[device].app)}
    >
        {children}
    </div>
);

/** The phone's and the tablet's status bar: the time on the left, signal, wi-fi and battery on the right. */
const StatusBar = ({ height, scale, inset }: { height: number; scale: number; inset: number }) => (
    <div
        className="absolute inset-x-0 top-0 flex items-center justify-between bg-neutral-100 text-neutral-950"
        style={{ height, paddingInline: inset }}
    >
        <span
            className="font-semibold tabular-nums tracking-normal"
            style={{ fontSize: 14 * scale, lineHeight: 1 }}
        >
            11:56
        </span>
        <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.45833}
            style={{ width: 62.1252 * scale, height: 9.45833 * scale }}
            viewBox="0 0 62.1252 9.45833"
        >
            <path d="M0.729167 8.72917H0.735833M4.0625 8.72917V6.0625M7.39583 8.72917V3.39583M10.7292 8.72917V0.729167" />
            <path d="M28.0626 8.72917H28.068M22.7292 2.76636C24.1959 1.45446 26.0948 0.729167 28.0626 0.729167C30.0305 0.729167 31.9293 1.45446 33.3961 2.76636M24.3292 4.92055C25.3262 3.94331 26.6666 3.39594 28.0626 3.39594C29.4587 3.39594 30.7991 3.94331 31.796 4.92055M26.1959 6.82459C26.6944 6.33597 27.3646 6.06229 28.0626 6.06229C28.7606 6.06229 29.4308 6.33597 29.9293 6.82459" />
            <path d="M61.3961 3.92917V5.52917M48.5961 3.92917V5.52917M51.7961 3.92917V5.52917M46.9961 0.729167H56.5961C57.4797 0.729167 58.1961 1.44551 58.1961 2.32917V7.12917C58.1961 8.01282 57.4797 8.72917 56.5961 8.72917H46.9961C46.1124 8.72917 45.3961 8.01282 45.3961 7.12917V2.32917C45.3961 1.44551 46.1124 0.729167 46.9961 0.729167Z" />
        </svg>
    </div>
);

/** A button on the frame's edge, as MCP Hosted's phone has them. */
const SideButton = ({ style }: { style: CSSProperties }) => (
    <span
        className="absolute -translate-y-1/2 rounded-[1px] bg-[#313234]"
        style={{ width: 1.5 * PHONE_SCALE, ...style }}
    />
);

/** Black glass, a metal edge and the screen inside; the phone and the tablet share it. */
const Handheld = ({
    device,
    bezel,
    radius,
    status,
    statusInset,
    statusScale,
    buttons,
    camera,
    children,
}: {
    device: 'tablet' | 'phone';
    bezel: number;
    radius: number;
    status: number;
    statusInset: number;
    statusScale: number;
    buttons: ReactNode;
    camera: ReactNode;
    children: ReactNode;
}) => {
    const { outer } = chromes[device];

    return (
        <div
            className="relative drop-shadow-[0_24px_12px_rgba(7,8,8,0.1)]"
            style={{ width: outer.width, height: outer.height }}
        >
            {buttons}
            <div
                className="absolute inset-0 overflow-hidden bg-[#090A0A]"
                style={{ borderRadius: radius }}
            >
                {/* The screen: the status bar over the app, behind the bezel's inner corner. */}
                <div
                    className="absolute overflow-hidden bg-neutral-100"
                    style={{ inset: bezel, borderRadius: radius - bezel }}
                >
                    <StatusBar height={status} inset={statusInset} scale={statusScale} />
                </div>
                <AppBox device={device}>{children}</AppBox>
                {/* The app's lower corners follow the screen's. */}
                <div
                    className="pointer-events-none absolute"
                    style={{
                        inset: bezel - 0.5,
                        borderRadius: radius - bezel + 0.5,
                        boxShadow: `0 0 0 ${bezel}px #090A0A`,
                    }}
                />
                {camera}
            </div>
            {/* The metal edge round the glass. */}
            <span
                className="pointer-events-none absolute inset-0 border-2 border-[#3A3B3E]"
                style={{ borderRadius: radius }}
            />
        </div>
    );
};

const PhoneChrome = ({ children }: { children: ReactNode }) => {
    const k = PHONE_SCALE;
    const middle = chromes.phone.outer.height / 2;

    return (
        <Handheld
            bezel={phone.bezel}
            buttons={
                <>
                    <SideButton
                        style={{ top: middle - 189.8 * k, left: -1.5 * k, height: 40 * k }}
                    />
                    <SideButton
                        style={{ top: middle - 141.8 * k, left: -1.5 * k, height: 40 * k }}
                    />
                    <SideButton
                        style={{ top: middle - 165.8 * k, right: -1.5 * k, height: 64 * k }}
                    />
                </>
            }
            camera={
                // The dynamic island, as MCP Hosted draws it.
                <span
                    className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#070808]"
                    style={{ top: phone.bezel + 14 * k, width: 91 * k, height: 28 * k }}
                >
                    <span
                        className="absolute rounded-full bg-[#050505]"
                        style={{ top: 5 * k, left: 5 * k, width: 47 * k, height: 18 * k }}
                    />
                    <span
                        className="absolute rounded-full bg-[#0B0D0D] shadow-[inset_0_1px_0_rgba(0,0,0,0.25)]"
                        style={{ top: 5 * k, left: 68 * k, width: 18 * k, height: 18 * k }}
                    />
                    <span
                        className="absolute rounded-full bg-[#1E1C37]"
                        style={{ top: 9 * k, left: 72 * k, width: 10 * k, height: 10 * k }}
                    />
                    <img
                        alt=""
                        className="absolute"
                        src={phoneCamera}
                        style={{ top: 10 * k, left: 73 * k, width: 8 * k, height: 8 * k }}
                    />
                </span>
            }
            device="phone"
            radius={60 * k}
            status={phone.status}
            statusInset={28 * k}
            statusScale={k}
        >
            {children}
        </Handheld>
    );
};

const TabletChrome = ({ children }: { children: ReactNode }) => {
    const k = PHONE_SCALE;

    return (
        <Handheld
            bezel={tablet.bezel}
            buttons={
                <>
                    {/* The top button on the top edge, the volume on the right. */}
                    <SideButton
                        style={{
                            top: 0,
                            right: 72,
                            width: 48,
                            height: 1.5 * k,
                            transform: 'translateY(-100%)',
                        }}
                    />
                    <SideButton style={{ top: 112, right: -1.5 * k, height: 44 }} />
                    <SideButton style={{ top: 164, right: -1.5 * k, height: 44 }} />
                </>
            }
            camera={
                <img
                    alt=""
                    className="absolute left-1/2 -translate-x-1/2"
                    src={phoneCamera}
                    style={{ top: (tablet.bezel - 8) / 2, width: 8, height: 8 }}
                />
            }
            device="tablet"
            radius={38}
            status={tablet.status}
            statusInset={20}
            statusScale={0.86}
        >
            {children}
        </Handheld>
    );
};

const MacbookChrome = ({ children }: { children: ReactNode }) => {
    const { outer } = chromes.desktop;

    return (
        <div className="relative" style={{ width: outer.width, height: outer.height }}>
            <img alt="" className="absolute inset-0 size-full" src={macbookBack} />
            {/* The display: square at the chin, rounded at the top, black under the notch. */}
            <div
                className="absolute overflow-hidden bg-black"
                style={{
                    ...boxStyle(desktopDisplay),
                    borderTopLeftRadius: MACBOOK_DISPLAY.radius * MACBOOK_SCALE,
                    borderTopRightRadius: MACBOOK_DISPLAY.radius * MACBOOK_SCALE,
                }}
            />
            <AppBox device="desktop">{children}</AppBox>
            <img
                alt=""
                className="pointer-events-none absolute inset-0 size-full"
                src={macbookFront}
            />
        </div>
    );
};

/** The device round a screen, drawn at the screen's size; the app goes in its `app` box. */
export const DeviceChrome = ({
    device,
    className,
    children,
}: {
    device: Device;
    className?: string;
    children: ReactNode;
}) => (
    <div className={cn('relative', className)}>
        {device === 'desktop' ? (
            <MacbookChrome>{children}</MacbookChrome>
        ) : device === 'tablet' ? (
            <TabletChrome>{children}</TabletChrome>
        ) : (
            <PhoneChrome>{children}</PhoneChrome>
        )}
    </div>
);
