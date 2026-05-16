import { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

/**
 * Optional credentials for the Nodey NFC Trigger node.
 *
 * Nodey does not authenticate webhook requests today. Both fields below are
 * forward-compatible and have no effect unless populated. Configure later if
 * Nodey adds HMAC signing, or use the tag UID allowlist immediately.
 */
export class NodeyApi implements ICredentialType {
  name = 'nodeyApi';
  displayName = 'Nodey API';
  documentationUrl =
    'https://github.com/TheFamousHesham/ghost-blocks/tree/master/packages/n8n-node-nodey#credentials';
  icon: Icon = 'file:nodey.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'Webhook Secret',
      name: 'webhookSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description:
        'Optional shared secret for HMAC verification. Nodey does not sign requests today — leave blank until signing ships. When set, requests without a valid X-Nodey-Signature header will be rejected.',
    },
    {
      displayName: 'Allowed Tag UIDs',
      name: 'allowedTagUids',
      type: 'string',
      default: '',
      placeholder: 'uid-1,uid-2,uid-3',
      description:
        'Optional comma-separated allowlist of NFC tag UIDs / trigger IDs. If set, only scans matching one of these IDs trigger the workflow. Leave blank to accept all scans.',
    },
  ];
}
