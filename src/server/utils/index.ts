import { Boom, Options as BoomOptions, } from '@hapi/boom';
import { ITOTP, ProfileType, userRole, userType, } from 'invest-models';
import * as speakeasy from 'speakeasy';
import { v4 as uuidv4, } from 'uuid';
import { IOutputEmpty, IOutputOk, } from '../interfaces/index';
import { Errors, } from './errors';
import { Output, OutputPagination, } from './utils.interfaces';

export function getUUID(): string {
	return uuidv4();
}

export function getCurrentTimestamp() {
	return Math.round(Date.now() / 1000);
}

export function getRealIp(request): string {
	return request.headers['cf-connecting-ip']
		? request.headers['cf-connecting-ip']
		: request.info.remoteAddress;
}

export function outputEmpty(): IOutputEmpty {
	return {
		ok: true,
	};
}

export function output<T>(res: T): Output<T> {
	return {
		ok: true,
		result: res,
	};
}

export function outputOk<R>(result: R): IOutputOk<R> {
	return {
		ok: true,
		result,
	};
}

export const outputPagination = <T>(count: number, res: Array<T>): OutputPagination<T> => ({
	ok: true,
	result: {
		count,
		items: res,
	},
});

interface BoomData<T = Record<string, unknown>> extends BoomOptions<T> {
	code: number;
	api: boolean;
	data: T;
}

export function error<T>(
	code: number,
	msg: string = Errors[code],
	data: T = null
): Boom<BoomData<T>> {
	return new Boom(msg, {
		data: {
			code,
			data,
			api: true,
		},
		statusCode: Math.floor(code / 1000),
	});
}

export function totpGenerateSecrets(): ITOTP {
	const secret = speakeasy.generateSecret();
	return {
		secret: secret.base32,
		qr: secret.otpauth_url,
	};
}

export function totpValidate(totp: string, secret: string): boolean {
	return speakeasy.totp.verify({
		secret,
		encoding: 'base32',
		token: totp,
	});
}

export function responseHandler(r, h) {
	// Handle default hapi errors (like not found, etc.)
	if (r.response.isBoom && r.response.data === null) {
		r.response = h
			.response({
				ok: false,
				code: Math.floor(r.response.output.statusCode * 1000),
				data: {},
				msg: r.response.message,
			})
			.code(r.response.output.statusCode);
		return r.response;
	}

	// Handle custom api error
	if (r.response.isBoom && r.response.data.api) {
		r.response = h
			.response({
				ok: false,
				code: r.response.data.code,
				data: r.response.data.data,
				msg: r.response.output.payload.message,
			})
			.code(Math.floor(r.response.data.code / 1000));
		return r.response;
	}

	// Handle non api errors with data
	if (r.response.isBoom && !r.response.data.api) {
		r.response = h
			.response({
				ok: false,
				code: Math.floor(r.response.output.statusCode * 1000),
				data: r.response.data,
				msg: r.response.message,
			})
			.code(r.response.output.statusCode);
		return r.response;
	}

	return h.continue;
}

export async function handleValidationError(r, h, err) {
	return error(
		400000,
		'Validation error',
		err.details.map((e) => ({ field: e.context.key, reason: e.type.replace('any.', ''), }))
	);
}

export const profileTypeRelations = {
	[userRole.BORROWER]: {
		[userType.ENTREPRENEUR]: ProfileType.BORROWER_ENTREPRENEUR,
		[userType.ENTITY]: ProfileType.BORROWER_ENTITY,
	},
	[userRole.INVESTOR]: {
		[userType.INDIVIDUAL]: ProfileType.INVESTOR_INDIVIDUAL,
		[userType.ENTREPRENEUR]: ProfileType.INVESTOR_ENTREPRENEUR,
		[userType.ENTITY]: ProfileType.INVESTOR_ENTITY,
	},
};
