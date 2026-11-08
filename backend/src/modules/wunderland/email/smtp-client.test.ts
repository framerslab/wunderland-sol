import * as net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { sendSmtpMail } from './smtp-client.js';

/**
 * A small SMTP server on 127.0.0.1 that accepts one message without TLS and
 * keeps what the client wrote after DATA, so the test reads the message as it
 * crossed the wire.
 */
function startFakeSmtp(): Promise<{ port: number; messages: string[]; close: () => Promise<void> }> {
  const messages: string[] = [];
  const server = net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    let data = '';
    socket.write('220 fake.smtp.test ready\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx: number;
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            messages.push(data);
            data = '';
            socket.write('250 2.0.0 queued\r\n');
          } else {
            data += `${line}\r\n`;
          }
          continue;
        }
        const cmd = line.toUpperCase();
        if (cmd.startsWith('EHLO')) socket.write('250-fake.smtp.test\r\n250 AUTH PLAIN\r\n');
        else if (cmd.startsWith('AUTH PLAIN')) socket.write('235 2.7.0 ok\r\n');
        else if (cmd.startsWith('MAIL FROM')) socket.write('250 ok\r\n');
        else if (cmd.startsWith('RCPT TO')) socket.write('250 ok\r\n');
        else if (cmd === 'DATA') {
          inData = true;
          socket.write('354 go ahead\r\n');
        } else if (cmd === 'QUIT') {
          socket.end('221 bye\r\n');
        } else socket.write('500 unknown\r\n');
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      resolve({
        port,
        messages,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

let close: (() => Promise<void>) | null = null;

afterEach(async () => {
  await close?.();
  close = null;
});

describe('sendSmtpMail writes the unsubscribe headers on the wire', () => {
  it('puts List-Unsubscribe and List-Unsubscribe-Post in the header block', async () => {
    const smtp = await startFakeSmtp();
    close = smtp.close;
    const url = 'https://wunderland.test/api/email/unsubscribe/' + 'x'.repeat(43);

    await sendSmtpMail({
      host: `127.0.0.1:${smtp.port}`,
      user: 'agent@owner.test',
      pass: 'secret',
      from: 'agent@owner.test',
      to: 'reader@example.com',
      subject: 'Hello',
      text: 'Body line\n\n-- \nUnsubscribe: ' + url + '\n',
      requireTLS: false,
      headers: {
        'List-Unsubscribe': `<${url}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    expect(smtp.messages).toHaveLength(1);
    const [head, ...rest] = smtp.messages[0].split('\r\n\r\n');
    const body = rest.join('\r\n\r\n');
    const lines = head.split('\r\n');
    expect(lines).toContain(`List-Unsubscribe: <${url}>`);
    expect(lines).toContain('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
    expect(body).toContain(`Unsubscribe: ${url}`);
  });

  it('refuses a header value that would start a new header line', async () => {
    const smtp = await startFakeSmtp();
    close = smtp.close;

    await expect(
      sendSmtpMail({
        host: `127.0.0.1:${smtp.port}`,
        user: 'agent@owner.test',
        pass: 'secret',
        from: 'agent@owner.test',
        to: 'reader@example.com',
        subject: 'Hello',
        text: 'Body',
        requireTLS: false,
        headers: { 'List-Unsubscribe': '<https://x.test/u>\r\nBcc: someone@evil.test' },
      })
    ).rejects.toThrow(/header/i);
    expect(smtp.messages).toHaveLength(0);
  });
});
