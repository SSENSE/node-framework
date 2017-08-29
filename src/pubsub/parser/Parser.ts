import { Provider } from './Provider';
import { Provider as Amazon } from './amazon/Provider';
import { Message } from './Message';

export class Parser {
    private providers: Provider[];

    constructor() {
        this.providers = [
            new Amazon()
        ];
    }

    public setMessageParseFunction(func: (message: string) => string): void {
        this.providers.forEach(p => {
            p.setMessageParseFunction(func);
        });
    }

    public parse(message: any): Promise<Message> {
        for (const provider of this.providers) {
            if (provider.canHandle(message)) {
                return provider.parse(message);
            }
        }

        throw new Error('Message not supported');
    }
}
