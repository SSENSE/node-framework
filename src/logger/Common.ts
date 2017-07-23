import * as uuid from 'uuid';

export enum Color {
    red = 31,
    green = 32,
    yellow = 33,
    blue = 34,
    cyan = 36
}

export function generateRequestId(): string {
    return uuid.v4();
}
