// External deps
import { Boom } from '@hapi/boom';
import { DisconnectReason, ConnectionState } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';

export const connectionUpdate = (
  bot: Bot,
  {
    connection,
    lastDisconnect,
  }: Partial<ConnectionState>,
) => {
  if (connection === 'close') {
  // reconnect if not logged out
    if (
      (lastDisconnect?.error as Boom)?.output?.statusCode
    !== DisconnectReason.loggedOut
    ) {
      bot?.startSock();
    } else {
    // eslint-disable-next-line no-console
      console.log('Connection closed. You are logged out.');
    }
  }
};

export default connectionUpdate;
