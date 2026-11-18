'use client';

import { cn } from 'continuum';
import { useEffect, useRef } from 'react';

/*
 * The footer's light: a glow from below, shining up through the name as if the letters were glass.
 * Each letter lets its light through as a soft shaft running away from the source, so the name and
 * the light are one thing. Glass bends each wavelength a little differently, so the shafts are traced
 * for five wavelengths from red to violet, violet spreading furthest, and each is given its own colour:
 * the shafts' tips fan out into a rainbow while the light near the letters stays warm white.
 *
 * The source sits far below the panel's foot, so the shafts rise from the letters nearly straight,
 * spreading only a little (the box under the canvas brightens towards the foot, as the hero board does); it sways a little, very slowly, and under reduced motion it holds still. The shader draws
 * the name itself, measured from the wordmark in the page (`[data-footer-name]`: its font, its
 * place, the mark's SVG), so the light can pass through it; the page's wordmark goes transparent only
 * once the shader runs (`data-lit` on the panel), so without WebGL the plain name shows. The canvas is clear
 * where there is no light, so the panel's surface and its dots show through, on the light and the dark
 * surface alike. It draws only while on screen, at 0.75 of a css pixel: the light is soft, and so is
 * the name.
 */

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform sampler2D face;
uniform sampler2D edge;
uniform sampler2D wide;
uniform vec2 size;
uniform vec2 source;
uniform vec3 surface;
uniform float pale;

float T(sampler2D t, vec2 uv) { return texture2D(t, vec2(uv.x, 1.0 - uv.y)).r; }

// A visible wavelength, in nm, as RGB (after Dan Bruton's approximation).
vec3 wave(float l) {
    vec3 c = vec3(1.0, 0.0, 0.0);
    if (l < 440.0) c = vec3(-(l - 440.0) / 60.0, 0.0, 1.0);
    else if (l < 490.0) c = vec3(0.0, (l - 440.0) / 50.0, 1.0);
    else if (l < 510.0) c = vec3(0.0, 1.0, -(l - 510.0) / 20.0);
    else if (l < 580.0) c = vec3((l - 510.0) / 70.0, 1.0, 0.0);
    else if (l < 645.0) c = vec3(1.0, -(l - 645.0) / 65.0, 0.0);
    return clamp(c, 0.0, 1.0);
}

// The light that came through the letters, at uv, for a spread k: walk back towards the glow and
// gather the glass on the way, so a point beyond a letter (away from the glow) catches its light. The
// walk is the same length wherever the glow is, so the shafts keep their reach with the glow behind
// the name, and the wavelengths have room to part.
float shaft(vec2 uv, float k) {
    vec2 aspect = vec2(size.x / size.y, 1.0);
    // Never past the source itself.
    vec2 apart = (source - uv) * aspect;
    float reach = min(k, length(apart));
    vec2 toward = normalize(apart + 0.0001) / aspect * reach / 14.0;
    float sum = 0.0;
    float weight = 1.0;
    vec2 p = uv;
    for (int i = 0; i < 14; i++) {
        sum += T(wide, p) * weight;
        weight *= 0.83;
        p += toward;
    }
    return sum / 5.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / size;
    vec2 aspect = vec2(size.x / size.y, 1.0);

    // Five wavelengths, 680 to 410 nm: the shorter, the further the glass spreads it.
    vec3 light = vec3(0.0);
    vec3 white = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float t = float(i) / 4.0;
        vec3 hue = wave(mix(680.0, 410.0, t));
        // Weighted by reach: the reds, which reach least, as strong near the letters as the blues are
        // further out, so every colour of the spectrum shows.
        light += hue * shaft(uv, mix(0.16, 0.78, t)) * mix(1.25, 0.9, t);
        white += hue;
    }
    light /= white;
    // Where the wavelengths part, keep their colour: the overlap would otherwise wash them to white.
    vec3 grey = vec3(dot(light, vec3(0.3333)));
    light = max(grey + (light - grey) * 3.0, 0.0);

    // The source is not drawn: the box under the canvas brightens towards its foot, as the hero's
    // board does, and that gradient is where the light comes from.
    // Exposed to match the light it had with the glow drawn, so its colours keep their balance.
    light = 1.0 - exp(-light * 1.05);
    float lit = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);

    // The surface (and its dots) is the page's, under the canvas: the canvas gives only the light, as
    // colour with its strength as alpha (premultiplied). On a dark surface that adds light; on a light
    // one it tints the white, since light can't darken it.
    vec3 hue = light / max(lit, 0.001);
    vec3 tint = surface * mix(vec3(1.0), hue, 0.9) * (1.0 - 0.1 * lit);
    vec3 glowing = mix(light, tint * lit, pale);

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
    float halo = T(edge, uv) * (1.0 - T(face, uv)) * 0.35 * (1.0 - pale);
    float f = T(face, uv);
    float alpha = clamp(mix(min(lit + halo, 1.0), 1.0, f), 0.0, 1.0);
    vec3 colour = mix(glowing + vec3(halo), letters, f);
    gl_FragColor = vec4(clamp(colour, 0.0, 1.0), alpha);
}
`;

/** A CSS colour as 0–1 RGB, through a 1×1 canvas, so any syntax the page uses (oklch included) reads. */
const toRgb = (() => {
    let context: CanvasRenderingContext2D | null = null;
    return (css: string): [number, number, number] => {
        context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        if (!context) return [0, 0, 0];
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = css;
        context.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
        return [r / 255, g / 255, b / 255];
    };
})();

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

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

/**
 * The wordmark drawn white on black at the canvas's pixel size, once per blur (in css px) and, for the
 * light it lets through, smeared sideways by its `spread`: where it
 * sits in the page, in its own font, so the shader's letters lie exactly on the page's.
 */
const drawName = async (
    canvas: HTMLCanvasElement,
    name: HTMLElement,
    blurs: { blur: number; spread?: number }[],
) => {
    const svg = name.querySelector('svg');
    const mark = svg ? await markImage(svg) : null;
    // Every place is read here, at one moment, after the wait: read on either side of it, a scroll
    // in between would put the name off by however far the page moved.
    const box = canvas.getBoundingClientRect();
    const ratio = canvas.width / Math.max(1, box.width);
    const style = getComputedStyle(name);
    const text = [...name.childNodes].find(
        node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    const range = document.createRange();
    if (text) range.selectNodeContents(text);
    const textRect = range.getBoundingClientRect();
    const markRect = svg?.getBoundingClientRect();
    const words = text?.textContent?.trim();

    /** The name and its mark, white, shifted `dx` canvas px sideways. */
    const paint = (context: CanvasRenderingContext2D, dx: number) => {
        if (text && words) {
            const fontSize = Number.parseFloat(style.fontSize) * ratio;
            context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
            const spacing = Number.parseFloat(style.letterSpacing);
            if ('letterSpacing' in context && !Number.isNaN(spacing))
                context.letterSpacing = `${spacing * ratio}px`;
            const metrics = context.measureText(words);
            context.textBaseline = 'alphabetic';
            context.fillText(
                words,
                (textRect.left - box.left) * ratio + dx,
                (textRect.top - box.top) * ratio + metrics.fontBoundingBoxAscent,
            );
        }
        if (markRect && mark) {
            context.drawImage(
                mark,
                (markRect.left - box.left) * ratio + dx,
                (markRect.top - box.top) * ratio,
                markRect.width * ratio,
                markRect.height * ratio,
            );
        }
    };

    return blurs.map(({ blur, spread = 0 }) => {
        const mask = document.createElement('canvas');
        mask.width = canvas.width;
        mask.height = canvas.height;
        const context = mask.getContext('2d');
        if (!context) return mask;
        context.fillStyle = '#000';
        context.fillRect(0, 0, mask.width, mask.height);
        if (blur) context.filter = `blur(${blur * ratio}px)`;
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

export const FooterShader = ({ className }: { className?: string }) => {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const element = canvas.current;
        const panel = element?.parentElement;
        const name = panel?.querySelector<HTMLElement>('[data-footer-name]');
        const gl = element?.getContext('webgl', { antialias: false, premultipliedAlpha: true });
        if (!element || !panel || !name || !gl) return;
        const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
        const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        const program = gl.createProgram();
        if (!vertex || !fragment || !program) return;
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
        // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
        gl.useProgram(program);

        // One triangle over the whole canvas.
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const uniform = {
            size: gl.getUniformLocation(program, 'size'),
            source: gl.getUniformLocation(program, 'source'),
            surface: gl.getUniformLocation(program, 'surface'),
            pale: gl.getUniformLocation(program, 'pale'),
        };
        const textures = ['face', 'edge', 'wide'].map((sampler, index) => {
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
        // The source's place, in the panel's 0–1 (y up): below the foot, in the middle.
        // Far below the foot, so the shafts rise nearly straight rather than fanning from a point.
        const glow = { x: 0.5, y: -0.9 };

        const readSurface = () => {
            const [r, g, b] = toRgb(getComputedStyle(panel).backgroundColor);
            gl.uniform3f(uniform.surface, r, g, b);
            gl.uniform1f(uniform.pale, 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? 1 : 0);
        };

        const draw = () => {
            gl.uniform2f(uniform.size, element.width, element.height);
            gl.uniform2f(uniform.source, glow.x, glow.y);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };

        // The name into the three masks: sharp for its face, a little soft for its edge, wide for
        // the light it lets through.
        const measure = async () => {
            // Soft light needs few pixels: 0.75 of a css px, a fraction of a retina screen's.
            const ratio = 0.75;
            element.width = Math.max(1, Math.round(element.clientWidth * ratio));
            element.height = Math.max(1, Math.round(element.clientHeight * ratio));
            gl.viewport(0, 0, element.width, element.height);
            await document.fonts.ready;
            const masks = await drawName(element, name, [
                { blur: 0.6 },
                { blur: 4 },
                { blur: 40, spread: 260 },
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
            glow.x = 0.5 + 0.03 * Math.sin(((now - started) / 1000) * 0.125);
            draw();
            if (visible && !still) frame = requestAnimationFrame(loop);
        };

        measure();
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

        return () => {
            alive = false;
            cancelAnimationFrame(frame);
            sizes.disconnect();
            seen.disconnect();
            modes.disconnect();
            delete panel.dataset.lit;
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, []);

    return <canvas aria-hidden className={cn('block size-full', className)} ref={canvas} />;
};
