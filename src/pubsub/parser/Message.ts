export abstract class Message {
    public provider: string;
    public id: string;
    public topic: string;
    public date: Date;
    public data: any;
    public isSubscription: boolean;
    public isUnsubscription: boolean;

    public abstract subscribeToTopic(): Promise<void>;
    public abstract unsubscribeFromTopic(): Promise<void>;
}
