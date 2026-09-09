// @ts-ignore
import config from 'config-vite';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * HTTPS dev/preview (2026-09-03): `HTTPS=1 pnpm dev` (or preview) serves over
 * TLS with the self-signed pair in .certs/ (gitignored *.pem — regenerate with
 * `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 825 -keyout
 * .certs/dev-key.pem -out .certs/dev-cert.pem -subj "/CN=mad-science-dev"
 * -addext "subjectAltName=IP:<lan ip>,DNS:localhost"`). A phone needs a SECURE
 * context for WebCodecs (the mascot's video engine); plain http://<lan-ip>
 * exposes no VideoDecoder at all. Without HTTPS=1 nothing changes.
 */
const certDir = fileURLToPath(new URL('./.certs/', import.meta.url));
const key = `${certDir}dev-key.pem`;
const cert = `${certDir}dev-cert.pem`;
const https =
	process.env.HTTPS === '1' && existsSync(key) && existsSync(cert)
		? { key: readFileSync(key), cert: readFileSync(cert) }
		: undefined;

const base = config();

export default {
	...base,
	...(https ? { server: { ...(base.server ?? {}), https }, preview: { ...(base.preview ?? {}), https } } : {}),
};
