import * as speakeasy from 'speakeasy';
import { handlerError, } from '../utils/error';
import { Errors, } from '../utils/errors';
import { error, totpValidate, } from '../utils';

export enum RouteMiddlewares {
	OperationConfirm = 'OperationConfirm',
}
export const confirmOperation = (r, h) => {
	try {
		const token = r.headers.confirmation;
		if (!token) {
			throw Error('Token not found');
		}

		const result = totpValidate(token, r.auth.credentials.security.totp.secret);
		if (!result) {
			throw Error('Failed to confirm operation');
		}

		return result;
	} catch (e) {
		return error(Errors.ConfirmationFailed, 'Failed to confirm operation');
	}
};

export const operationConfirm = {
	method: confirmOperation,
	assign: RouteMiddlewares.OperationConfirm,
};
