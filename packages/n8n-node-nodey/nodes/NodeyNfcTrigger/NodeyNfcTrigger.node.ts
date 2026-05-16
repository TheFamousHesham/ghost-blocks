// n8n-nodes-nodey — verified-compatible NFC trigger node.
// Receives NFC tap events from the Nodey mobile app (iOS + Android) via a
// webhook and emits a normalized payload into the workflow.
//
// Uses only n8n-workflow types and node:crypto (via ./verify-signature). No
// fs, fetch, dns, or timers — passes the verified-community-node sandbox.

import {
  IDataObject,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  Icon,
} from 'n8n-workflow';

import { normalize } from './normalize-payload';
import { verifySignature } from './verify-signature';

interface NodeyCredentials {
  webhookSecret?: string;
  allowedTagUids?: string;
}

const SIGNATURE_HEADERS = ['x-nodey-signature', 'x-signature', 'x-hub-signature-256'];

function parseUidAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractUid(body: IDataObject): string | undefined {
  const candidates = [body.tagUid, body.tag_uid, body.triggerId, body.trigger_id];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}

function pickSignatureHeader(headers: Record<string, unknown>): string | undefined {
  for (const name of SIGNATURE_HEADERS) {
    const value = headers[name];
    if (typeof value === 'string' && value.length > 0) return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return undefined;
}

export class NodeyNfcTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Nodey NFC Trigger',
    name: 'nodeyNfcTrigger',
    icon: 'file:nodey.svg' as Icon,
    group: ['trigger'],
    version: 1,
    description: 'Triggered when an NFC tag is scanned via the Nodey mobile app',
    defaults: { name: 'Nodey NFC Trigger' },
    inputs: [] as any,
    outputs: ['main'] as any,
    credentials: [{ name: 'nodeyApi', required: false }],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'nodey-nfc',
      },
    ],
    properties: [
      {
        displayName:
          'Triggered when you tap an NFC tag using the <a href="https://getnodey.com" target="_blank">Nodey app</a> on iOS or Android. Copy the Production URL below into your Nodey NFC trigger configuration.',
        name: 'nodeyPromoNotice',
        type: 'notice',
        default: '',
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          {
            name: 'Normalized',
            value: 'normalized',
            description:
              'Merge iOS and Android shapes into one consistent object (platform, triggerName, triggerId, customData, ...).',
          },
          {
            name: 'Raw Payload',
            value: 'raw',
            description: 'Pass the request body straight through without normalization.',
          },
        ],
        default: 'normalized',
      },
      {
        displayName: 'Parse Android customData',
        name: 'parseCustomData',
        type: 'boolean',
        default: true,
        description:
          'Whether to parse Android\'s customData JSON string into a nested object. iOS payloads are unaffected.',
        displayOptions: { show: { outputFormat: ['normalized'] } },
      },
      {
        displayName:
          'Nodey delivers each scan at-most-once — if the phone is offline or the request fails, Nodey records the failure but does not retry. If your workflow needs guaranteed delivery, handle queueing or acknowledgement on the n8n side.',
        name: 'deliveryNotice',
        type: 'notice',
        default: '',
      },
      {
        displayName:
          'More from this author: <a href="https://www.npmjs.com/package/n8n-nodes-ghost-blocks-cloud" target="_blank">n8n-nodes-ghost-blocks-cloud</a> (Ghost CMS publishing, also verified).',
        name: 'ecosystemNotice',
        type: 'notice',
        default: '',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const body = (this.getBodyData() ?? {}) as IDataObject;
    const headers = (this.getHeaderData() ?? {}) as Record<string, unknown>;
    const outputFormat = this.getNodeParameter('outputFormat') as string;
    const parseCustomData = this.getNodeParameter('parseCustomData', true) as boolean;

    const credentials = (await this.getCredentials('nodeyApi').catch(() => null)) as
      | NodeyCredentials
      | null;

    // Optional HMAC verification — only enforced if a secret is configured.
    if (credentials?.webhookSecret) {
      const signatureHeader = pickSignatureHeader(headers);
      const req = this.getRequestObject();
      // Express's body-parser stashes the raw body on req.rawBody when configured
      // to do so. n8n's webhook handler does this for binary endpoints but not
      // always for JSON — fall back to re-serializing if the raw bytes aren't
      // available. This is best-effort until Nodey publishes their signing spec.
      const rawBody =
        (req as unknown as { rawBody?: string | Buffer }).rawBody?.toString() ?? JSON.stringify(body);

      const ok = verifySignature({
        rawBody,
        secret: credentials.webhookSecret,
        signatureHeader,
      });

      if (!ok) {
        return {
          webhookResponse: {
            status: 401,
            body: { error: 'invalid signature' },
          },
        };
      }
    }

    // Optional tag UID allowlist — silently 200 OK on mismatch so an attacker
    // can't probe the allowlist by watching status codes.
    const allowed = parseUidAllowlist(credentials?.allowedTagUids);
    if (allowed.length > 0) {
      const incoming = extractUid(body);
      if (!incoming || !allowed.includes(incoming)) {
        return {
          webhookResponse: { status: 200, body: { status: 'ignored' } },
        };
      }
    }

    const output: IDataObject =
      outputFormat === 'raw' ? body : (normalize(body, parseCustomData) as unknown as IDataObject);

    return {
      workflowData: [[{ json: output }]],
      webhookResponse: { status: 200, body: { status: 'ok' } },
    };
  }
}
