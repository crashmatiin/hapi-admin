import { Boom, } from '@hapi/boom';
import * as Hapi from '@hapi/hapi';
import { AuthArtifacts, } from '@hapi/hapi';
import { Admin, AdminRole, AdminSession, PermissionLevel, sessionStatus, } from 'invest-models';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { Errors, } from './errors';
import { error, } from './index';

export enum Token {
	Access = 'access',
	Refresh = 'refresh',
}

export interface JWT {
	access: string;
	refresh: string;
}

export const generateJwt = (data: Record<string, unknown>): JWT => {
	const access = jwt.sign(data, config.auth.jwt.access.secret, {
		expiresIn: config.auth.jwt.access.lifetime,
	});
	const refresh = jwt.sign(data, config.auth.jwt.refresh.secret, {
		expiresIn: config.auth.jwt.refresh.lifetime,
	});

	return { access, refresh, };
};

const decodeJwt = async (token: string, secret: string): Promise<jwt.JwtPayload | string> => {
	try {
		return jwt.verify(token, secret);
	} catch (e) {
		const code = e.name === 'TokenExpiredError' ? Errors.TokenExpired : Errors.TokenInvalid;
		const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid';
		throw error(code, msg, {});
	}
};

interface TokenValidateSuccess<T> {
	isValid: boolean;
	credentials: T;
	artifacts: AuthArtifacts;
}

export function extractPermissions(_session) {
	const session = _session.toJSON();
	const writePermissions = [];
	const readPermissions = [];
	Object.entries(session.admin.role).forEach((permission) => {
		if (permission[1] === PermissionLevel.WRITE) {
			writePermissions.push(permission[0]);
		}

		if (permission[1] !== PermissionLevel.NONE) {
			readPermissions.push(permission[0]);
		}
	});
	return { writePermissions, admin: session.admin, readPermissions, };
}

export type ValidateTokenFn = (r, token: string) => Promise<TokenValidateSuccess<any> | Boom>;

async function sessionCreate(token: string, tokenType: Token): Promise<AdminSession> {
	const data = await decodeJwt(token, config.auth.jwt[tokenType].secret);
	const id = typeof data === 'string' ? data : data.id;
	const session = await AdminSession.findByPk(id, {
		include: [{ model: Admin, include: [{ model: AdminRole, }], }],
	});
	if (!session) {
		throw error(Errors.SessionNotFound, 'Session wasn\'t found', {});
	}

	return session;
}

async function returnCredentials(token: string, tokenType: Token, session: AdminSession) {
	if (session.admin) {
		const { writePermissions, admin, readPermissions, } = extractPermissions(session);
		return {
			isValid: true,
			credentials: { admin, writePermissions, readPermissions, security: admin.security, },
			artifacts: { token, type: tokenType, sessionId: session.id, },
		};
	}

	throw error(Errors.SessionNotFound, 'Admin not found', {});
}

// Fabric which returns token validate function depending on token type
export function tokenValidate(tokenType: Token): ValidateTokenFn {
	return async function fn(r, token: string) {
		const data = await decodeJwt(token, config.auth.jwt[tokenType].secret);

		const sessionId = typeof data === 'string' ? data : data.id;

		const session = await AdminSession.findOne({
			where: {
				id: sessionId,
				status: sessionStatus.ACTIVE,
			},
			include: [
				{
					model: Admin,
					include: [
						{
							model: AdminRole,
						}
					],
				}
			],
		});

		if (session) {
			if (session.ip !== getIPFromRequestHeaders(r)) {
				throw error(Errors.SessionIsSuspicious, 'Session is suspicious', {});
			}

			return returnCredentials(token, tokenType, session);
		}

		throw error(Errors.SessionNotFound, 'Session not found', {});
	};
}

export function simpleTokenValidate(tokenType: Token): ValidateTokenFn {
	return async function fn(r, token: string) {
		const session = await sessionCreate(token, tokenType);

		return returnCredentials(token, tokenType, session);
	};
}

export function getIPFromRequestHeaders(r: Hapi.Request): string {
	return r.headers['x-forwarded-for'] ?? '127.0.0.1';
}
