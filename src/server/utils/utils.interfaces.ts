import { Options as BoomOptions, } from '@hapi/boom';
import { Sequelize, } from 'sequelize-typescript';

export interface IFileWithExt {
	data: Buffer;
	fileExt: string;
}

export interface Output<T> {
	ok: boolean;
	result: T;
}

export interface OutputPagination<T> {
	ok: boolean;
	result: {
		count: number;
		items: Array<T>;
	};
}

export interface BoomData<T = Record<string, unknown>> extends BoomOptions<T> {
	code: number;
	api: boolean;
	data: T;
}

export interface ServerApp {
	db: Sequelize;
}
export interface IAuthToken {
	userId: string;
	timestamp: number;
}
export interface IReq {
	baseURL: string;
	method: string;
	url: string;
	headers: {
		Authorization: string;
	};
}
export interface IListQueries {
	offset?: number;
	limit?: number;
	order?: {
		[key: string]: 'ASC' | 'DESC';
	};
	query?: string;
}

export interface IListLoansQueries extends IListQueries {
	scheduleVersion?: number;
	userId?: string;
}
