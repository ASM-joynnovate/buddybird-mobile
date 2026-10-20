import { d1Database, r2Storage } from '@hot-updater/cloudflare';
import { expo } from '@hot-updater/expo';
import { withSentry } from '@hot-updater/sentry-plugin';
import { defineConfig } from 'hot-updater';
import { apiKeys, insights, remoteConfig } from 'hot-updater/plugins';
import { existsSync } from 'node:fs';

if (existsSync('.env.hotupdater')) {
	process.loadEnvFile('.env.hotupdater');
}

const CLOUDFLARE_ACCOUNT_ID = '0c4453da6d81adec04df8132e00660c4';
const variant = process.env.APP_VARIANT === 'production' ? 'prod' : 'dev';

export default defineConfig({
	build: withSentry(expo({ sourcemap: true }), {
		org: 'joynnovate',
		project: 'buddybird-mobile',
		authToken: String(process.env.SENTRY_AUTH_TOKEN ?? ''),
	}),
	storage: r2Storage({
		bucketName: 'jn-buddybird-ota',
		accountId: CLOUDFLARE_ACCOUNT_ID,
		credentials: {
			accessKeyId: String(process.env.HOT_UPDATER_CLOUDFLARE_R2_ACCESS_KEY_ID ?? ''),
			secretAccessKey: String(process.env.HOT_UPDATER_CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? ''),
		},
	}),
	database: d1Database({
		databaseId: '60caa3be-b185-40c7-9f2d-7ef5ee96c5d3',
		accountId: CLOUDFLARE_ACCOUNT_ID,
		cloudflareApiToken: String(process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN ?? ''),
	}),
	plugins: [apiKeys(), insights(), remoteConfig()],
	updateStrategy: 'fingerprint',
	signing: {
		enabled: true,
		privateKeyPath:
			process.env.HOT_UPDATER_SIGNING_PRIVATE_KEY_PATH ?? `./config/${variant}/hot-updater/private-key.pem`,
	},
});
