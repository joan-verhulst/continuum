/*
 * Pixel avatars: eight compositions of shape and texture, each in two colours only, one of 32 colours
 * and a neutral. Each is a rule over a 16 × 16 grid (is this pixel the figure?) rather than a drawing,
 * so the edges and textures are exact. They need not sit in the middle: a shape may lean on an edge or
 * run off it, and a round avatar crops it like a window. Lab code, outside the package.
 */

export const GRID = 16;
const last = GRID - 1;

/** A 4 × 4 ordered dither: a pixel is the figure when its threshold is below the tone there. */
const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
];

const patterns = {
    /** A tone that darkens from top to bottom. */
    dither: (x: number, y: number) => (bayer[y % 4]?.[x % 4] ?? 0) < (y / last) * 15 - 4,
    /** Rings rising out of the bottom-right corner, 2px apart by 3.5, across the whole tile. */
    rings: (x: number, y: number) => {
        const d = Math.hypot(x + 0.5 - GRID, y + 0.5 - GRID);
        return d % 5.5 < 2;
    },
    /** Bands that wave across. */
    waves: (x: number, y: number) =>
        (((y + Math.round(2 * Math.sin((x * Math.PI) / 4))) % 5) + 5) % 5 < 2,
    /** Diagonal stripes. */
    stripes: (x: number, y: number) => (x + y) % 6 < 2,
    /** A brick wall: 1px mortar, every other course shifted by half a brick. */
    bricks: (x: number, y: number) => {
        const course = Math.floor((y + 2) / 4);
        return (y + 2) % 4 === 0 || (x + (course % 2) * 3) % 6 === 0;
    },
    /** A grid drawn in stitches: 2px lines of alternate pixels, solid where they cross. */
    stitch: (x: number, y: number) => {
        const across = (y + 3) % 8 < 2;
        const down = (x + 3) % 8 < 2;
        return (across && down) || ((across || down) && (x + y) % 2 === 0);
    },
    /** Diagonal lines both ways: a lattice. */
    lattice: (x: number, y: number) => (x + y) % 10 < 2 || (((x - y) % 10) + 10) % 10 < 2,
    /** Rows of arches, every other row shifted by half: scales. */
    scales: (x: number, y: number) => {
        const row = Math.floor(y / 4);
        const lx = (x + (row % 2) * 4) % 8;
        return Math.abs(Math.hypot(lx + 0.5 - 4, (y % 4) + 0.5 - 4) - 3.5) < 0.55;
    },
} satisfies Record<string, (x: number, y: number) => boolean>;

export type Sprite = keyof typeof patterns;
export const spriteNames = Object.keys(patterns) as Sprite[];
export const sprites = Object.fromEntries(
    spriteNames.map(name => [
        name,
        Array.from({ length: GRID }, (_, y) =>
            Array.from({ length: GRID }, (_, x) => (patterns[name](x, y) ? '#' : '.')).join(''),
        ),
    ]),
) as Record<Sprite, string[]>;

/** The two neutrals a pattern is drawn in: Continuum's neutral-950 and neutral-50. */
export const neutrals = { 950: '#0d0d0d', 50: '#f8f8f8' } as const;
export type Neutral = keyof typeof neutrals;

/*
 * 32 colours, one per hue, 11.25° apart around the wheel. A colour keeps its hue and chroma with either
 * neutral and changes only its lightness: light under a neutral-950 pattern, deep under a neutral-50
 * one, the way a theme has a light and a dark side. One lightness per side, so no hue stands out.
 */
const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(i => {
        const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const CHROMA = 0.16;
const lightness: Record<Neutral, number> = { 950: 0.8, 50: 0.56 };

export type AvatarColour = { id: string; hue: number; hex: Record<Neutral, string> };

export const colours: AvatarColour[] = Array.from({ length: 32 }, (_, i) => {
    const hue = (i * 360) / 32;
    return {
        id: `hue-${hue}`,
        hue,
        hex: {
            950: oklchToHex(lightness[950], CHROMA, hue),
            50: oklchToHex(lightness[50], CHROMA, hue),
        },
    };
});

/** WCAG contrast between two colours, for the lab's check. */
export const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m) as [number, number];
    return (x + 0.05) / (y + 0.05);
};

/** One row of pixels as runs, so a sprite is a handful of rects rather than a hundred. */
const pathFor = (rows: string[]) =>
    rows
        .flatMap((row, y) =>
            [...row.matchAll(/#+/g)].map(
                run => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`,
            ),
        )
        .join('');

export type AvatarSvgOptions = {
    sprite: Sprite;
    colour: string;
    /** The ground in colour and the figure neutral, or the other way round. */
    fill?: 'ground' | 'figure';
    /** Which neutral draws with the colour. */
    neutral?: Neutral;
    shape?: 'square' | 'round';
};

export const avatarSvg = ({
    sprite,
    colour,
    fill = 'ground',
    neutral = 950,
    shape = 'square',
}: AvatarSvgOptions) => {
    const ground = fill === 'ground' ? colour : neutrals[neutral];
    const figure = fill === 'ground' ? neutrals[neutral] : colour;
    const clip =
        shape === 'round'
            ? `<circle cx="${GRID / 2}" cy="${GRID / 2}" r="${GRID / 2}"/>`
            : `<rect width="${GRID}" height="${GRID}"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}" shape-rendering="crispEdges"><clipPath id="c">${clip}</clipPath><g clip-path="url(#c)"><rect width="${GRID}" height="${GRID}" fill="${ground}"/><path d="${pathFor(sprites[sprite])}" fill="${figure}"/></g></svg>`;
};

/** The same seed always gets the same face and colour: 8 × 32 = 256 avatars. */
export const avatarFor = (seed: string) => {
    let hash = 2166136261;
    for (const char of seed) hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0;
    const sprite = spriteNames[hash % spriteNames.length] as Sprite;
    const colour = colours[Math.floor(hash / spriteNames.length) % colours.length] as AvatarColour;
    return { sprite, colour };
};

function oklchToHex(l: number, c: number, h: number) {
    const toHex = (cc: number) => {
        const a = cc * Math.cos((h * Math.PI) / 180);
        const b = cc * Math.sin((h * Math.PI) / 180);
        const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = l - 0.0894841775 * a - 1.291485548 * b;
        const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
        const lin = [
            4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
            -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
            -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
        ];
        if (lin.some(v => v < -0.0005 || v > 1.0005)) return null;
        return `#${lin
            .map(v => {
                const x = Math.min(1, Math.max(0, v));
                const g = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
                return Math.round(g * 255)
                    .toString(16)
                    .padStart(2, '0');
            })
            .join('')}`;
    };
    // Lower the chroma until the colour fits sRGB, keeping its lightness and hue.
    for (let cc = c; cc >= 0; cc -= 0.002) {
        const hex = toHex(cc);
        if (hex) return hex;
    }
    return toHex(0) as string;
}
