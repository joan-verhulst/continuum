/*
 * Laying out a treemap: each share becomes a rectangle whose area is that share of the
 * whole, as close to square as the shares allow (Bruls, Huizing and van Wijk's squarified
 * layout). A square is read for its size at a glance; a sliver is not read at all.
 */

export type Rect = { x: number; y: number; width: number; height: number };

const total = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);

/** How far from square the worst rectangle of a row would be, laid along a side this long. */
const worst = (row: readonly number[], side: number) => {
    const sum = total(row);
    const largest = Math.max(...row);
    const smallest = Math.min(...row);
    return Math.max((side * side * largest) / (sum * sum), (sum * sum) / (side * side * smallest));
};

/** Lays a finished row along the shorter side of what is left, and returns what is left after it. */
const place = (row: readonly number[], room: Rect, out: Rect[]): Rect => {
    const sum = total(row);
    if (room.width >= room.height) {
        const width = sum / room.height;
        let y = room.y;
        for (const area of row) {
            const height = area / width;
            out.push({ x: room.x, y, width, height });
            y += height;
        }
        return { x: room.x + width, y: room.y, width: room.width - width, height: room.height };
    }
    const height = sum / room.width;
    let x = room.x;
    for (const area of row) {
        const width = area / height;
        out.push({ x, y: room.y, width, height });
        x += width;
    }
    return { x: room.x, y: room.y + height, width: room.width, height: room.height - height };
};

/**
 * The rectangles for a set of values, in the order the values were given. The largest are
 * laid first, from the top left, so the order on the page is the order of size.
 */
export const squarify = (values: readonly number[], room: Rect): Rect[] => {
    const whole = total(values);
    if (whole <= 0 || room.width <= 0 || room.height <= 0)
        return values.map(() => ({ ...room, width: 0, height: 0 }));

    const scale = (room.width * room.height) / whole;
    const order = values
        .map((value, index) => ({ index, area: Math.max(0, value) * scale }))
        .sort((a, b) => b.area - a.area);

    const laid: Rect[] = [];
    let left = { ...room };
    let row: number[] = [];
    const queue = order.map(item => item.area);
    while (queue.length) {
        const next = queue[0] as number;
        const side = Math.min(left.width, left.height);
        if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) {
            row.push(next);
            queue.shift();
        } else {
            left = place(row, left, laid);
            row = [];
        }
    }
    if (row.length) place(row, left, laid);

    const out: Rect[] = new Array(values.length);
    order.forEach((item, i) => {
        out[item.index] = laid[i] as Rect;
    });
    return out;
};
