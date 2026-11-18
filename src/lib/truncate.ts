/*
 * Where a name is cut when it is truncated in the middle: the end it keeps whole, worked out from
 * what kind of string it is. The start is never counted here; it fills whatever width is left.
 */

// A file extension: a dot, then 1–6 letters or digits with at least one letter (".pdf", ".mp4",
// ".tar"), so a version ("v1.2") or an amount ("4.50") is not read as one.
const extension = /\.(?=[a-z0-9]{0,5}[a-z])[a-z0-9]{1,6}$/i;

// Where a name is naturally broken: the start of the tail is moved back to one of these.
const separators = /[-_ .]/;

// A path's last part is kept whole when it is no longer than this; longer, it is cut as a file name.
const segmentMax = 24;

/** The last piece of `stem` from a separator between `min` and `max` characters from its end. */
const piece = (stem: string, min: number, max: number, fallback: number) => {
    for (let n = min; n <= Math.min(max, stem.length - 1); n++) {
        if (separators.test(stem[stem.length - n] ?? '')) {
            return stem.slice(-n);
        }
    }
    const n = Math.min(fallback, stem.length - 1);
    return n > 0 ? stem.slice(-n) : '';
};

/** The end of a file name kept whole: its extension and the last word of its name. */
const fileTail = (name: string) => {
    const ext = name.match(extension)?.[0];
    if (!ext || ext.length >= name.length) {
        return null;
    }
    const stem = name.slice(0, -ext.length);
    return piece(stem, 3, 10, 6) + ext;
};

/**
 * The end of `text` that a middle truncation keeps whole, so the part that tells one name from the
 * next always shows:
 * - a path keeps its last part (`/donut-chart.tsx`), or that part's file-name end when it is long;
 * - a file name keeps its extension and the last word before it (`-final.pdf`);
 * - a hash or an ID keeps its last 4 characters (`9c1b`), as it is read and compared;
 * - other text keeps its last word, or 8 characters.
 */
export const truncationTail = (text: string): string => {
    const slash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
    if (slash >= 0 && slash < text.length - 1) {
        const segment = text.slice(slash);
        if (segment.length <= segmentMax) {
            return segment;
        }
        return fileTail(segment) ?? segment.slice(-8);
    }

    const file = fileTail(text);
    if (file) {
        return file;
    }

    if (!/\s/.test(text)) {
        return text.slice(-4);
    }

    return piece(text, 4, 14, 8);
};

/**
 * `text` split for a middle truncation: the `head` that narrows to an ellipsis and the `tail` kept
 * whole. `end` is how many characters the tail keeps; left out, `truncationTail` decides by the
 * kind of string. A text too short to cut has an empty tail.
 */
export const splitForTruncation = (text: string, end?: number) => {
    const tail = end === undefined ? truncationTail(text) : end > 0 ? text.slice(-end) : '';
    // Cutting only pays when the head keeps a few characters of its own beside the ellipsis.
    if (tail.length === 0 || text.length - tail.length < 4) {
        return { head: text, tail: '' };
    }
    return { head: text.slice(0, text.length - tail.length), tail };
};
