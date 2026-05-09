import { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

/**
 * Credentials for the Ghost Blocks node.
 *
 * Note: We don't define a built-in credential test because Ghost requires
 * short-lived JWTs generated per-request from the admin key (HS256-signed
 * with a hex-decoded secret). n8n's built-in credential test mechanism only
 * supports static-header auth.
 *
 * Instead, the node has a built-in "Test Connection" operation under the
 * Health resource that hits /site and returns a clean error if auth fails.
 */
export class GhostBlocksApi implements ICredentialType {
  name = 'ghostBlocksApi';
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
