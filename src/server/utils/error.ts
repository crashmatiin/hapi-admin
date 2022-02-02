import { Boom, } from '@hapi/boom';
import { error, } from './index';
import { Errors, } from './errors';

export class Exception extends Error {
	public readonly isException: boolean;

	public readonly code: number;

	public readonly msg: string;

	public readonly data?: Readonly<Record<string, unknown>>;

	constructor(code: number, msg: string, data?: Readonly<Record<string, unknown>>) {
		super(msg);
		this.isException = true;
		this.code = code;
		this.msg = msg;
		if (data) {
			this.data = data;
		}
	}
}

export function handlerError(msg: string, err: Exception | Boom | any | undefined): Boom {
	if (err.isBoom) {
		return err;
	}

	if (err.isException) {
		return error(err.code, err.msg, err.data);
	}

	console.log(msg, err);
	return error(Errors.InternalServerError, msg, {});
	// switch (err.constructor.name) {
	// 	case 'Exception':
	// 		return error(err.code, err.msg, err.data);
	// 	case 'Boom':
	// 		return err;
	// 	default:
	// 		console.error(msg, err);
	// 		return error(Errors.InternalServerError, msg, {});
	// }
}
