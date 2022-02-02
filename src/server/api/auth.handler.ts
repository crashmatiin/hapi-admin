import { Lifecycle, } from '@hapi/hapi';
import * as Hapi from '@hapi/hapi';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as generator from 'generate-password';
import { Admin, AdminSession, adminStatus, sessionStatus, } from 'invest-models';
import { Exception, handlerError, } from '../utils/error';
import config from '../config/config';
import { output, totpGenerateSecrets, totpValidate, } from '../utils';
import { generateJwt, getIPFromRequestHeaders, JWT, } from '../utils/auth';
import { Errors, ErrorsMessages, } from '../utils/errors';
import { EmailType, SendEmailMqRequest, } from 'mq-plugin/protocols';
import { Boom, Output, } from '@hapi/boom';
import { IOutputOk, } from 'server/interfaces';

export const registerAdmin = async (r) => {
	try {
		const { email, role, } = r.payload;

		const adminExist = await Admin.findOne({
			where: {
				email,
			},
		});
		if (adminExist) {
			throw new Exception(Errors.EmailExists, ErrorsMessages[Errors.EmailExists], {});
		}

		const rdmPass = generator.generate({ length: 12, numbers: true, symbols: true, });
		await Admin.create({ email, password: rdmPass, role, });
		const emailMessage: SendEmailMqRequest<EmailType.RegistrationCode> = {
			to: email,
			type: EmailType.RegistrationCode,
			fields: {
				code: rdmPass,
			},
		};
		r.server.mqSend('email', emailMessage);
		return output({ password: rdmPass, });
	} catch (err) {
		return handlerError('Register error', err);
	}
};

interface AuthPayload {
	email: string;
	password: string;
	totp: string;
}

export const loginAdmin: Lifecycle.Method = async (r) => {
	try {
		const { email, password, totp, } = r.payload as AuthPayload;
		const message = 'Invalid credentials';
		const admin = await Admin.scope('withPassword').findOne({
			where: {
				email,
			},
		});
		if (!admin) {
			throw new Exception(Errors.InvalidPayload, message, {});
		}

		if (!admin.passwordCompare(password)) {
			throw new Exception(Errors.InvalidPayload, message, {});
		}

		// if (admin.status !== adminStatus.NEW) {
		// 	if (!totpValidate(totp, admin.security.totp.secret)) {
		// 		throw new Exception(Errors.InvalidPayload, message, {});
		// 	}
		// }

		const session = await AdminSession.create({
			adminId: admin.id,
			status: sessionStatus.ACTIVE,
			ip: getIPFromRequestHeaders(r),
			adminAgent: r.headers['user-agent'],
		});
		return output(
			generateJwt({
				id: session.id,
				adminId: admin.id,
				lastName: admin.lastName,
				firstName: admin.firstName,
				middleName: admin.middleName,
				role: admin.roleKey,
			})
		);
	} catch (err) {
		return handlerError('Failed to login admin', err);
	}
};

export async function refreshTokens(r: Hapi.Request): Promise<IOutputOk<JWT> | Boom> {
	try {
		const admin = r.auth.credentials.admin as Admin;
		await AdminSession.update(
			{
				status: sessionStatus.FINISHED,
			},
			{
				where: {
					id: r.auth.artifacts.sessionId,
				},
			}
		);
		const adminSession = await AdminSession.create({
			adminId: admin.id,
			ip: getIPFromRequestHeaders(r),
			adminAgent: r.headers['user-agent'],
		});
		return output(generateJwt({ id: adminSession.id, }));
	} catch (err) {
		return handlerError('Faild to refresh token', err);
	}
}

export const createTOTPSecrets = async (r) => {
	try {
		const admin = await Admin.findByPk(r.auth.credentials.id);
		if (admin.status !== adminStatus.NEW) {
			throw new Exception(Errors.Forbidden, 'Your account is already activated', {});
		}

		const totp = totpGenerateSecrets();
		await admin.update({
			security: {
				...admin.security,
				totp,
			},
		});
		return output({ totp, });
	} catch (err) {
		return handlerError('Failed to create TOTP', err);
	}
};

export const activateTOTP = async (r) => {
	const admin = await Admin.findByPk(r.auth.credentials.id);
	await admin.update({
		status: adminStatus.ACTIVE,
	});
	if (!totpValidate(r.payload.totp, admin.security.totp.secret)) {
		throw new Exception(Errors.InvalidPayload, 'Invalid totp', {});
	}

	return output({ msg: 'Your account was activated', });
};

export const restorePasswordRequest = async (r) => {
	try {
		const { email, } = r.payload as Pick<AuthPayload, 'email'>;
		const admin = await Admin.scope('withPassword').findOne({
			where: {
				email,
			},
		});

		const { restorePassTimeout, restorePassTokenLive, } = config.auth;
		const now = Math.floor(Date.now() / 1000);

		if (admin.security) {
			const { restorePasswordLastRequest, } = admin.security;

			if (restorePasswordLastRequest && restorePasswordLastRequest > now - restorePassTimeout) {
				throw new Exception(Errors.TooManyRequests, 'Try again later', {
					lastRequest: restorePasswordLastRequest,
					timeout: restorePassTimeout,
				});
			}
		}

		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenHash = await bcrypt.hash(resetToken, 10);

		const emailMessage: SendEmailMqRequest<EmailType.RestoreCode> = {
			to: email,
			type: EmailType.RestoreCode,
			fields: {
				code: resetToken,
			},
		};
		r.server.mqSend('email', emailMessage);

		await admin.update({
			security: {
				restorePasswordExpires: now + restorePassTokenLive,
				restorePasswordLastRequest: now,
				restorePasswordToken: resetTokenHash,
			},
		});
		return output({ expired: now + restorePassTimeout, });
	} catch (err) {
		return handlerError('Error restore password', err);
	}
};

interface RestorePasswordPayload {
	adminId: number;
	token: string;
	password: string;
}

export const restorePassword: Lifecycle.Method = async (r) => {
	try {
		const { adminId, token, password, } = r.payload as RestorePasswordPayload;
		const admin = await Admin.scope('withSettings').findOne({
			where: { id: adminId, },
		});
		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin not found', {});
		}

		const tokenIsExpired = admin.security.restorePasswordExpires < Date.now() / 1000;
		if (tokenIsExpired) {
			throw new Exception(Errors.TokenExpired, ErrorsMessages[Errors.TokenExpired], {});
		}

		const tokenIsValid = await bcrypt.compare(token, admin.security.restorePasswordToken);
		if (!tokenIsValid) {
			throw new Exception(Errors.TokenInvalid, ErrorsMessages[Errors.TokenInvalid], {});
		}

		await admin.update({
			password,
			settings: {},
		});

		const emailMessage: SendEmailMqRequest<EmailType.ChangePasswordSuccess> = {
			to: admin.email,
			type: EmailType.ChangePasswordSuccess,
			fields: {},
		};
		r.server.mqSend('email', emailMessage);
		return true;
	} catch (err) {
		return handlerError('Error restore password', err);
	}
};

interface ChangePasswordPayload {
	oldPassword: string;
	newPassword: string;
}

export const changePassword: Lifecycle.Method = async (r) => {
	const { oldPassword, newPassword, } = r.payload as ChangePasswordPayload;
	const { id, } = r.auth.credentials;
	const admin = await Admin.scope('withPassword').findByPk(id as number);
	const checkOldPassword = admin.passwordCompare(oldPassword);
	if (!checkOldPassword) {
		throw new Exception(Errors.InvalidPayload, 'Invalid old password', {});
	}

	await admin.update({ password: newPassword, });
	const emailMessage: SendEmailMqRequest<EmailType.ChangePasswordSuccess> = {
		to: admin.email,
		type: EmailType.ChangePasswordSuccess,
		fields: {},
	};
	r.server.mqSend('email', emailMessage);
	return true;
};

export async function generateToken(r) {
	const token = r.server.fsCreateToken(r.params.userId, r.params.tokenType);
	return output({ token, });
}
