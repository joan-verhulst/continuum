/*
 * What the site's lights share: the footer's and the hero's (GlassLight). Reading a
 * page colour for a shader, compiling one, and the colour of a wavelength.
 */

/** A CSS colour as 0–1 RGB, through a 1×1 canvas, so any syntax the page uses (oklch included) reads. */
export const toRgb = (() => {
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

/** A surface's relative luminance above a half: the light tints it rather than adding to it. */
export const isPale = ([r, g, b]: [number, number, number]) =>
    0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;

export const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

/** One triangle over the whole canvas. */
export const FULL_SCREEN = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

/** The program from FULL_SCREEN and a fragment shader, in use, with its triangle bound; null if either fails. */
export const fullScreenProgram = (gl: WebGLRenderingContext, fragmentSource: string) => {
    const vertex = compile(gl, gl.VERTEX_SHADER, FULL_SCREEN);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    return program;
};

/** GLSL: a visible wavelength, in nm, as RGB (after Dan Bruton's approximation). */
export const WAVE = `
vec3 wave(float l) {
    vec3 c = vec3(1.0, 0.0, 0.0);
    if (l < 440.0) c = vec3(-(l - 440.0) / 60.0, 0.0, 1.0);
    else if (l < 490.0) c = vec3(0.0, (l - 440.0) / 50.0, 1.0);
    else if (l < 510.0) c = vec3(0.0, 1.0, -(l - 510.0) / 20.0);
    else if (l < 580.0) c = vec3((l - 510.0) / 70.0, 1.0, 0.0);
    else if (l < 645.0) c = vec3(1.0, -(l - 645.0) / 65.0, 0.0);
    return clamp(c, 0.0, 1.0);
}
`;
