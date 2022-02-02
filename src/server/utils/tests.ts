import { Admin, AdminSession, } from 'invest-models';
import { generateJwt, } from './auth';

export function testRequest(server, method, url, payload, token = '') {
	const options = {
		method,
		url,
		payload,
		headers: undefined,
	};
	if (token) {
		options.headers = { authorization: `Bearer ${token}`, };
	}

	return server.inject(options);
}

export async function createTestAdmin(credentials) {
	const admin = await Admin.create({
		...credentials,
	});
	const session = await AdminSession.create({
		adminId: admin.id,
	});
	return generateJwt({ id: session.id, });
}

export async function wrapServer(_server) {
	const server = await _server.init(true);
	server.$get = (url, payload = null, token = null) =>
		testRequest(server, 'get', url, payload, token);
	server.$post = (url, payload = null, token = null) =>
		testRequest(server, 'post', url, payload, token);
	return server;
}
