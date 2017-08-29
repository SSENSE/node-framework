import { Helper } from '../Helper';
import { Message as BaseMessage } from '../Message';

export class Message extends BaseMessage {
    protected subscribeUrl: string;
    protected unsubscribeUrl: string;

    public setSubscribeUrl(url: string): void {
        this.subscribeUrl = url;
    }

    public setUnsubscribeUrl(url: string): void {
        this.unsubscribeUrl = url;
    }

    public async subscribeToTopic(): Promise<void> {
        if (this.subscribeUrl) {
            await Helper.getUrl(this.subscribeUrl);
        }
    }

    public async unsubscribeFromTopic(): Promise<void> {
        if (this.unsubscribeUrl) {
            await Helper.getUrl(this.unsubscribeUrl);
        }
    }
}
