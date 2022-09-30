// External deps
import fs from 'fs';
import Crypto from 'crypto';
import Stream from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import {
  downloadContentFromMessage, MediaType, proto, WAMessage,
} from '@adiwajshing/baileys';
import { tmpdir } from 'os';

export const getMedia = async (msg) => {
  const messageType = Object.keys(msg?.message)[0];
  const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace('Message', '') as MediaType);
  let buffer = Buffer.from([]);
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

export const videoToSticker = async (media) => {
  const videoType = media.mimetype.split('/')[1];

  const tempFile = path.join(
    tmpdir(),
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
  );

  const stream = new (Stream.Readable)();
  stream.push(media.buffer);
  stream.push(null);

  await new Promise((resolve, reject) => {
    ffmpeg(stream)
      .inputFormat(videoType)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec',
        'libwebp',
        '-vf',
        // eslint-disable-next-line no-useless-escape
        'scale=\'iw*min(300/iw\,300/ih)\':\'ih*min(300/iw\,300/ih)\',format=rgba,pad=300:300:\'(300-iw)/2\':\'(300-ih)/2\':\'#00000000\',setsar=1,fps=10',
        '-loop',
        '0',
        '-ss',
        '00:00:00.0',
        '-t',
        '00:00:05.0',
        '-preset',
        'default',
        '-an',
        '-vsync',
        '0',
        '-s',
        '512:512',
      ])
      .toFormat('webp')
      .save(tempFile);
  });

  const data = fs.readFileSync(tempFile);
  fs.unlinkSync(tempFile);

  return data;
};

export const getMessageText = (msg: WAMessage) => msg.message?.conversation
  || msg.message?.imageMessage?.caption
  || msg.message?.videoMessage?.caption
  || '';

export const getQuotedMessage = (msg: WAMessage) => {
  const quotedMessage = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quotedMessage || null;
};

export const hasMediaForSticker = (msg: proto.IMessage) => {
  const hasMedia = !!(msg?.imageMessage || msg?.videoMessage);
  return hasMedia;
};

export const isGroup = (chatId: string) => !chatId.includes('whatsapp.net');
