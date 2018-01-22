import { Message } from './Message';

export interface Provider {
    setMessageParseFunction(func: (message: string) => any): void;
    canHandle(message: any): boolean;
    parse(message: any): Promise<Message>;
}
