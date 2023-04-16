/**
 * Self explanatory. Uses a Set instead of Array because has() is faster than includes()
*/
export function randomRange(min: number, max: number, exclude?: number[] | Set<number>) {
    if (!(exclude instanceof Set)) exclude = new Set(exclude);

    let r!: number;
    do {
        r = Math.floor(Math.random() * (max - min)) + min;
    } while (exclude.has(r));

    return r;
}

/**
 * Clamp a value within a range
 * @param preferred The value to clamp within the range
 */
export function clamp(min: number, preferred: number, max: number) {
    // this code is perfectly fine
    return Math.max(min, Math.min(preferred, max));
}