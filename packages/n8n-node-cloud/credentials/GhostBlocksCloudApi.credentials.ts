import { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

/**
 * Credentials for the Ghost Blocks Cloud node.
 *
 * No built-in credential test — Ghost requires short-lived JWTs (HS256 with
 * hex-decoded secret) which n8n's standard test mechanism can't generate.
 * Use the node's Health > Test Connection operation instead.
 */
export class GhostBlocksCloudApi implements ICredentialType {
  name = 'ghostBlocksCloudApi';
  displayName = 'Ghost Blocks API';
  documentationUrl = 'https://github.com/TheFamousHesham/ghost-blocks#authentication';
  icon: Icon = 'file:ghost.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'Ghost URL',
      name: 'url',
      type: 'string',
      default: '',
      placeholder: 'https://my-site.ghost.io',
      required: true,
      description:
        'Your Ghost site URL (without trailing slash). The Admin API is at {url}/ghost/api/admin/.',
    },
    {
      displayName: 'Admin API Key',
      name: 'adminKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Your Ghost Admin API key in the format "{id}:{secret}". Create one in Ghost Admin → Settings → Integrations → Add custom integration.',
    },
    {
      displayName: 'API Version',
      name: 'apiVersion',
      type: 'string',
      default: 'v5.0',
      description: 'Ghost Admin API version to target. Most users should leave this as v5.0.',
    },
  ];
}
