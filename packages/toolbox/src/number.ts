export const clamp = (number: number, lower: number, upper: number) => {
    return Math.min(Math.max(number, lower), upper);
};
