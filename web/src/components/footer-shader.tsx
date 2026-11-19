'use client';

import { cn } from 'continuum';
import { useEffect, useRef } from 'react';
import { fullScreenProgram, isPale, toRgb, WAVE } from '@/lib/gl';
import { type Tunable, tunable } from '@/lib/tunable';

/*
 * The footer's light: a glow from below, shining up through the name as if the letters were glass.
 * Each letter lets its light through as a soft shaft running away from the source, so the name and
 * the light are one thing. Glass bends each wavelength a little differently, so the shafts are traced
 * for five wavelengths from red to violet, violet spreading furthest, and each is given its own colour:
 * the shafts' tips fan out into a rainbow while the light near the letters stays warm white.
 *
 * The source sits at the middle of the box's foot, held still, so the shafts fan up and out
 * from the letters towards the top corners; behind them a haze, the same
 * light from a far softer name, spreads wider without adding to the brightness at the letters. A
 * sway can move the source slowly from side to side (off by default; under reduced motion it always
 * holds still). Every number is in LIGHT, set by eye at `?tune` (FooterTuner). The shader draws
 * the name itself, measured from the wordmark in the page (`[data-footer-name]`: its font, its
 * place, the mark's SVG), so the light can pass through it; the page's wordmark goes transparent only
 * once the shader runs (`data-lit` on the panel), so without WebGL the plain name shows. The canvas is clear
 * where there is no light, so the panel's surface and its dots show through, on the light and the dark
 * surface alike. It draws only while on screen, at 0.75 of a css pixel: the light is soft, and so is
 * the name.
 */

const FRAGMENT = `
precision highp float;
uniform sampler2D face;
uniform sampler2D edge;
uniform sampler2D wide;
uniform sampler2D haze;
uniform vec2 size;
uniform vec2 source;
uniform vec3 surface;
uniform float pale;
uniform vec2 reach;
uniform float falloff;
uniform float exposure;
uniform float colour;
uniform float hazeStrength;
uniform float hazeReach;
uniform float drawGlass;
uniform float margin;
uniform float strength;

// A mask at uv. The masks reach \`margin\` past the box on every side, so glass outside it (and the
// walk towards a source outside it) still finds what lies there.
float T(sampler2D t, vec2 uv) {
    float s = 1.0 + 2.0 * margin;
    return texture2D(t, vec2((uv.x + margin) / s, (1.0 + margin - uv.y) / s)).r;
}

${WAVE}

// The light that came through the letters, at uv, for a spread k: walk back towards the glow and
// gather the glass on the way, so a point beyond a letter (away from the glow) catches its light. The
// walk is the same length wherever the glow is, so the shafts keep their reach with the glow behind
// the name, and the wavelengths have room to part.
float shaft(sampler2D t, vec2 uv, float k) {
    vec2 aspect = vec2(size.x / size.y, 1.0);
    // Never past the source itself.
    vec2 apart = (source - uv) * aspect;
    float walk = min(k, length(apart));
    vec2 toward = normalize(apart + 0.0001) / aspect * walk / 14.0;
    float sum = 0.0;
    float weight = 1.0;
    float total = 0.0;
    vec2 p = uv;
    for (int i = 0; i < 14; i++) {
        sum += T(t, p) * weight;
        total += weight;
        weight *= falloff;
        p += toward;
    }
    // Over the weights' own sum, so a longer or shorter falloff spreads the light without changing
    // how much of it there is.
    return sum / total;
}

void main() {
    vec2 uv = gl_FragCoord.xy / size;
    vec2 aspect = vec2(size.x / size.y, 1.0);

    // Five wavelengths, 680 to 410 nm: the shorter, the further the glass spreads it.
    vec3 light = vec3(0.0);
    vec3 haloed = vec3(0.0);
    vec3 white = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float t = float(i) / 4.0;
        vec3 hue = wave(mix(680.0, 410.0, t));
        float k = mix(reach.x, reach.y, t);
        // Weighted by reach: the reds, which reach least, as strong near the letters as the blues are
        // further out, so every colour of the spectrum shows.
        float w = mix(1.25, 0.9, t);
        light += hue * shaft(wide, uv, k) * w;
        // The haze: the same light from a far softer name, reaching further, behind the shafts.
        haloed += hue * shaft(haze, uv, k * hazeReach) * w;
        white += hue;
    }
    light = (light + haloed * hazeStrength) / white;
    // Where the wavelengths part, keep their colour: the overlap would otherwise wash them to white.
    vec3 grey = vec3(dot(light, vec3(0.3333)));
    light = max(grey + (light - grey) * colour, 0.0);

    // The source is not drawn: the box under the canvas brightens towards its foot, as the hero's
    // board does, and that gradient is where the light comes from.
    // Exposed to match the light it had with the glow drawn, so its colours keep their balance.
    light = 1.0 - exp(-light * exposure);
    float lit = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);

    // The surface (and its dots) is the page's, under the canvas: the canvas gives only the light, as
    // colour with its strength as alpha (premultiplied). On a dark surface that adds light; on a light
    // one it tints the white, since light can't darken it.
    vec3 hue = light / max(lit, 0.001);
    vec3 tint = surface * mix(vec3(1.0), hue, 0.9) * (1.0 - 0.1 * lit);
    // Strength dims the light evenly, as an opacity: its colours stay where they are.
    vec3 glowing = mix(light, tint * lit, pale) * strength;
    lit *= strength;

    // The letters, the glass the light comes through: lit a touch more near the glow, a hairline
    // where their edge faces it.
    vec2 e = vec2(1.0) / size;
    vec2 slope = vec2(T(edge, uv + vec2(e.x, 0.0)) - T(edge, uv - vec2(e.x, 0.0)),
                      T(edge, uv + vec2(0.0, e.y)) - T(edge, uv - vec2(0.0, e.y)));
    vec2 towards = normalize((source - uv) * aspect + 0.0001);
    float rim = max(dot(slope, towards), 0.0) * 0.7;
    float near = clamp(1.0 - length((uv - source) * aspect) * 0.6, 0.0, 1.0);
    vec3 ink = mix(vec3(0.96), vec3(0.08), pale);
    vec3 letters = ink * mix(0.9, 1.0, near) + vec3(rim) * (1.0 - pale) * 0.5;
    // A glow round the letters, as lit glass has: white on the dark surface, the light's own tint on
    // the light one.
    float halo = T(edge, uv) * (1.0 - T(face, uv)) * 0.35 * (1.0 - pale) * drawGlass;
    // Where the page draws the glass itself (drawGlass 0), the canvas gives the light alone.
    float f = T(face, uv) * drawGlass;
    float alpha = clamp(mix(min(lit + halo, 1.0), 1.0, f), 0.0, 1.0);
    vec3 colour = mix(glowing + vec3(halo), letters, f);
    gl_FragColor = vec4(clamp(colour, 0.0, 1.0), alpha);
}
`;

/** The mark's SVG as an image, in white, so it can be drawn into the masks. */
const markImage = (svg: SVGSVGElement) =>
    new Promise<HTMLImageElement | null>(resolve => {
        const copy = svg.cloneNode(true) as SVGSVGElement;
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        copy.style.color = '#fff';
        const url = URL.createObjectURL(
            new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }),
        );
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        image.src = url;
    });

/** Paints the glass white, in the canvas's pixels from the box's top left, shifted `dx` sideways. */
type Paint = (context: CanvasRenderingContext2D, dx: number) => void;

/** A rectangle of glass: its centre in the box's 0–1 (y up, past 0 or 1 is outside), its size in box widths and heights. */
export type GlassRect = { x: number; y: number; width: number; height: number };

/** A rectangle of glass, painted where it lies, inside the box or out. */
const rectPaint =
    (canvas: HTMLCanvasElement, rect: GlassRect): Paint =>
    (context, dx) =>
        context.fillRect(
            (rect.x - rect.width / 2) * canvas.width + dx,
            (1 - rect.y - rect.height / 2) * canvas.height,
            rect.width * canvas.width,
            rect.height * canvas.height,
        );

/**
 * An element of the page as glass: where it sits, word by word in its own font (so text over several
 * lines lies right too), with any SVG in it (the mark), so the shader's glass lies exactly on the page's.
 */
const elementPaint = async (canvas: HTMLCanvasElement, name: HTMLElement): Promise<Paint> => {
    const svgs = [...name.querySelectorAll('svg')];
    const marks = await Promise.all(svgs.map(markImage));
    // Every place is read here, at one moment, after the wait: read on either side of it, a scroll
    // in between would put the glass off by however far the page moved.
    const box = canvas.getBoundingClientRect();
    const ratio = canvas.width / Math.max(1, box.width);
    const words: { text: string; rect: DOMRect; style: CSSStyleDeclaration }[] = [];
    const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('svg')) continue;
        const style = getComputedStyle(parent);
        for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const rect = range.getClientRects()[0];
            if (rect) words.push({ text: match[0], rect, style });
        }
    }
    const markRects = svgs.map(svg => svg.getBoundingClientRect());

    return (context, dx) => {
        context.textBaseline = 'alphabetic';
        for (const { text, rect, style } of words) {
            const fontSize = Number.parseFloat(style.fontSize) * ratio;
            context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
            const spacing = Number.parseFloat(style.letterSpacing);
            if ('letterSpacing' in context)
                context.letterSpacing = `${Number.isNaN(spacing) ? 0 : spacing * ratio}px`;
            const metrics = context.measureText(text);
            context.fillText(
                text,
                (rect.left - box.left) * ratio + dx,
                (rect.top - box.top) * ratio + metrics.fontBoundingBoxAscent,
            );
        }
        markRects.forEach((rect, index) => {
            const mark = marks[index];
            if (!mark) return;
            context.drawImage(
                mark,
                (rect.left - box.left) * ratio + dx,
                (rect.top - box.top) * ratio,
                rect.width * ratio,
                rect.height * ratio,
            );
        });
    };
};

/**
 * The glass drawn white on black, once per blur (in css px) and, for the light it lets through,
 * smeared sideways by its `spread`. Each mask reaches `margin` (in box sizes) past the box on every
 * side. A soft mask is drawn small (a quarter of the canvas's pixels, its blur with it) and
 * stretched by the shader, which keeps a slider's drag quick; a `skip`ped one is a black pixel.
 */
const drawMasks = (
    canvas: HTMLCanvasElement,
    paint: Paint,
    margin: number,
    blurs: { blur: number; spread?: number; skip?: boolean }[],
) => {
    const ratio = canvas.width / Math.max(1, canvas.clientWidth);
    return blurs.map(({ blur, spread = 0, skip = false }) => {
        const mask = document.createElement('canvas');
        const scale = skip ? 0 : blur >= 16 ? 0.25 : 1;
        mask.width = Math.max(1, Math.round(canvas.width * (1 + 2 * margin) * scale));
        mask.height = Math.max(1, Math.round(canvas.height * (1 + 2 * margin) * scale));
        const context = mask.getContext('2d');
        if (!context) return mask;
        context.fillStyle = '#000';
        context.fillRect(0, 0, mask.width, mask.height);
        if (skip) return mask;
        context.scale(scale, scale);
        context.translate(canvas.width * margin, canvas.height * margin);
        if (blur) context.filter = `blur(${blur * ratio * scale}px)`;
        context.fillStyle = '#fff';
        if (!spread) {
            paint(context, 0);
            return mask;
        }
        // Smeared sideways rather than scaled: the name again and again, shifted out to `spread` css px
        // either way and fainter the further out, the brightest of them kept. The light keeps its
        // height and softness at the name and runs on, thinning, past both its ends.
        context.globalCompositeOperation = 'lighten';
        const steps = 10;
        for (let i = -steps; i <= steps; i++) {
            // The name itself at full strength; its smear a third of it, so the ends run on faintly.
            context.globalAlpha = i === 0 ? 1 : 0.32 * (1 - Math.abs(i) / (steps + 1)) ** 1.5;
            paint(context, (i / steps) * spread * ratio);
        }
        return mask;
    });
};

/**
 * The light's settings. The source is in the box's 0–1, y up, so a negative y is below its foot; the
 * reach runs from the reds' (near) to the violets' (far), in box heights. Blur and spread shape the
 * masks (css px), so changing them redraws the name; the rest are uniforms.
 */
export const LIGHT = {
    x: 0.5,
    y: -0.01,
    sway: 0,
    near: 0.04,
    far: 0.99,
    falloff: 0.9,
    exposure: 1.3,
    colour: 3,
    blur: 58,
    spread: 200,
    haze: 0.3,
    hazeReach: 1.6,
    hazeBlur: 110,
    hazeSpread: 420,
    strength: 1,
};

export type Light = typeof LIGHT;

/** The settings in effect, shared with the tuner (`?tune`). */
export const lightStore = tunable<Light>(LIGHT);

/** The settings that shape the masks, so a change to any of them redraws the name. */
const maskKeys = ['blur', 'spread', 'hazeBlur', 'hazeSpread'] as const;

/**
 * Light shining through glass. The glass is either an element (a selector: text, and any SVG in it),
 * looked for in the nearest `[data-light-scope]` round the canvas or else the canvas's parent, or a
 * rectangle read from the settings, which may lie outside the box (`margin`, in box sizes, is how far
 * past its edges the glass and the source can be). The surface is the scope's. With `letters`, the
 * shader draws the glass itself (the footer's name, the page's own going transparent once it does);
 * without, nothing of the glass is drawn and the canvas gives the light alone.
 */
export const GlassLight = <T extends Light>({
    className,
    glass,
    store,
    letters = false,
    margin = 0,
    bake,
}: {
    className?: string;
    glass: string | ((light: T) => GlassRect);
    store: Tunable<T>;
    letters?: boolean;
    margin?: number;
    /** Filled with a function that draws the light and returns it as an image (a WebP data URL, alpha kept). */
    bake?: { current: (() => string) | null };
}) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const element = canvas.current;
        const panel = element?.parentElement;
        const scope = element?.closest<HTMLElement>('[data-light-scope]') ?? panel;
        const name = typeof glass === 'string' ? scope?.querySelector<HTMLElement>(glass) : null;
        const gl = element?.getContext('webgl', { antialias: false, premultipliedAlpha: true });
        if (!element || !panel || !scope || !gl) return;
        if (typeof glass === 'string' && !name) return;
        const program = fullScreenProgram(gl, FRAGMENT);
        if (!program) return;
        const uniform = {
            size: gl.getUniformLocation(program, 'size'),
            source: gl.getUniformLocation(program, 'source'),
            surface: gl.getUniformLocation(program, 'surface'),
            pale: gl.getUniformLocation(program, 'pale'),
            reach: gl.getUniformLocation(program, 'reach'),
            falloff: gl.getUniformLocation(program, 'falloff'),
            exposure: gl.getUniformLocation(program, 'exposure'),
            colour: gl.getUniformLocation(program, 'colour'),
            hazeStrength: gl.getUniformLocation(program, 'hazeStrength'),
            hazeReach: gl.getUniformLocation(program, 'hazeReach'),
            strength: gl.getUniformLocation(program, 'strength'),
        };
        gl.uniform1f(gl.getUniformLocation(program, 'drawGlass'), letters ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'margin'), margin);
        const textures = ['face', 'edge', 'wide', 'haze'].map((sampler, index) => {
            gl.activeTexture(gl.TEXTURE0 + index);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.uniform1i(gl.getUniformLocation(program, sampler), index);
            return texture;
        });

        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let frame = 0;
        let visible = false;
        let alive = true;
        const started = performance.now();
        let light = store.get();
        // The sway, added to the source's place.
        let sway = 0;

        const readSurface = () => {
            const rgb = toRgb(getComputedStyle(scope).backgroundColor);
            gl.uniform3f(uniform.surface, ...rgb);
            gl.uniform1f(uniform.pale, isPale(rgb) ? 1 : 0);
        };

        const draw = () => {
            gl.uniform2f(uniform.size, element.width, element.height);
            gl.uniform2f(uniform.source, light.x + sway, light.y);
            gl.uniform2f(uniform.reach, light.near, light.far);
            gl.uniform1f(uniform.falloff, light.falloff);
            gl.uniform1f(uniform.exposure, light.exposure);
            gl.uniform1f(uniform.colour, light.colour);
            gl.uniform1f(uniform.hazeStrength, light.haze);
            gl.uniform1f(uniform.hazeReach, light.hazeReach);
            gl.uniform1f(uniform.strength, light.strength);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        // Read in the same task as the draw, while the frame is still in the buffer.
        if (bake)
            bake.current = () => {
                draw();
                return element.toDataURL('image/webp', 0.92);
            };

        // The name into the four masks: sharp for its face, a little soft for its edge, wide for
        // the light it lets through, wider still for the haze behind it.
        // While one is being drawn, a change only marks it to run once more after, with the latest
        // values: a slider's drag skips what it passed through.
        let running = false;
        let again = false;
        const measure = async () => {
            if (running) {
                again = true;
                return;
            }
            running = true;
            do {
                again = false;
                await remask();
            } while (again && alive);
            running = false;
        };

        const remask = async () => {
            // Soft light needs few pixels: 0.75 of a css px, a fraction of a retina screen's.
            const ratio = 0.75;
            const width = Math.max(1, Math.round(element.clientWidth * ratio));
            const height = Math.max(1, Math.round(element.clientHeight * ratio));
            // Set only when it changed: setting it clears what is drawn.
            if (element.width !== width || element.height !== height) {
                element.width = width;
                element.height = height;
                gl.viewport(0, 0, width, height);
            }
            await document.fonts.ready;
            const paint =
                typeof glass === 'string'
                    ? name && (await elementPaint(element, name))
                    : rectPaint(element, glass(light));
            if (!paint) return;
            const masks = drawMasks(element, paint, margin, [
                // The glass's face and edge only where the shader draws it.
                { blur: 0.6, skip: !letters },
                { blur: 4, skip: !letters },
                { blur: light.blur, spread: light.spread },
                { blur: light.hazeBlur, spread: light.hazeSpread },
            ]);
            if (!alive) return;
            masks.forEach((mask, index) => {
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, textures[index] ?? null);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
            });
            readSurface();
            draw();
            // Now the shader draws the name, the page's own may step aside.
            panel.dataset.lit = '';
        };

        const loop = (now: number) => {
            // A sway of a few hundredths either side, once in about 50 s: the shafts stay alive
            // without anything to follow.
            sway = light.sway * Math.sin(((now - started) / 1000) * 0.125);
            draw();
            if (visible && !still) frame = requestAnimationFrame(loop);
        };

        measure();
        // Again once whatever brings the glass in (a reveal's rise) has settled.
        const settled = window.setTimeout(measure, 1500);
        const sizes = new ResizeObserver(() => measure());
        sizes.observe(element);
        const seen = new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            cancelAnimationFrame(frame);
            if (visible && !still) frame = requestAnimationFrame(loop);
        });
        seen.observe(element);
        const modes = new MutationObserver(() => {
            readSurface();
            draw();
        });
        modes.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-mode', 'data-theme', 'style'],
        });
        // A change from the tuner: the masks again when their shape changed, else just a frame.
        const tuned = store.subscribe(() => {
            const before = light;
            light = store.get();
            const moved =
                typeof glass !== 'string' &&
                JSON.stringify(glass(before)) !== JSON.stringify(glass(light));
            if (moved || maskKeys.some(key => before[key] !== light[key])) measure();
            else draw();
        });

        return () => {
            alive = false;
            if (bake) bake.current = null;
            window.clearTimeout(settled);
            tuned();
            cancelAnimationFrame(frame);
            sizes.disconnect();
            seen.disconnect();
            modes.disconnect();
            delete panel.dataset.lit;
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, [glass, store, letters, margin, bake]);

    return <canvas aria-hidden className={cn('block size-full', className)} ref={canvas} />;
};

/** The footer's: the name, drawn by the shader in its light. */
export const FooterShader = ({ className }: { className?: string }) => (
    <GlassLight className={className} glass="[data-footer-name]" letters store={lightStore} />
);
