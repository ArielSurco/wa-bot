import { proto } from '@adiwajshing/baileys';

class MessageRetryHandler {
  public messagesMap: Record<string, proto.IMessage>;

  constructor() {
    this.messagesMap = {};
  }

  async addMessage(message: proto.IWebMessageInfo) {
    const id = message.key.id ?? '';
    this.messagesMap[id] = this.cleanMessage(message);
    return message;
  }

  getMessage(msgKey: string): proto.IMessage {
    return this.messagesMap[msgKey];
  }

  removeMessage(msgKey: string) {
    delete this.messagesMap[msgKey];
  }

  getMessageKeys(): string[] {
    return Object.keys(this.messagesMap);
  }

  // eslint-disable-next-line class-methods-use-this
  cleanMessage(message: proto.IWebMessageInfo): proto.IMessage {
    const msg = message.message ?? {};
    return msg;
  }

  messageRetryHandler = async (message: proto.IMessageKey) => {
    const msg = this.getMessage(message.id ?? '');
    this.removeMessage(message.id ?? '');
    return msg;
  };
}

export default MessageRetryHandler;
