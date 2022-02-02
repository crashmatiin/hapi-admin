import * as Hapi from '@hapi/hapi';
import { Boom, } from '@hapi/boom';
import { ExpressLoan, IExpressLoan, } from 'invest-models/lib/models/ExpressLoan';
import { ExpressLoanStatus, } from 'invest-models';
import { ExpressLoanFile, User, userStatus, } from 'invest-models';
import { Op, Order, WhereOptions, } from 'sequelize';
import { IOutputOk, } from '../interfaces/index';
import { Errors, } from '../utils/errors';
import { outputEmpty, outputOk, outputPagination, } from '../utils';
import { Exception, handlerError, } from '../utils/error';
import { prepareQuery, } from '../utils/helpers';

function listParam(query: Hapi.RequestQuery): {
	order: Order;
	limit: number;
	offset: number;
	where: WhereOptions<any>;
} {
	const { offset, limit, order, where, from, to, } = query;
	const orderOptions: Order = [];
	if (order) {
		for (const [key, value] of Object.entries(order)) {
			orderOptions.push([key, value as string]);
		}
	}

	const whereOptions: WhereOptions<any> = {
		...prepareQuery(where, [
			'tin',
			'status',
			'Users.firstName',
			'Users.lastName',
			'Users.middleName'
		]),
		createdAt: {
			[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
		},
	};
	return {
		order: orderOptions,
		limit,
		offset,
		where: whereOptions,
	};
}

export async function getAll(r: Hapi.Request) {
	try {
		const { count, rows, } = await ExpressLoan.findAndCountAll({
			...listParam(r.query),
			include: [
				{
					model: User.scope('withSettings'),
					where: {
						status: userStatus.TEMPORARY,
					},
				}
			],
			distinct: true,
		});

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list express loans', err);
	}
}

export async function get(r: Hapi.Request): Promise<IOutputOk<Omit<IExpressLoan, 'email'>> | Boom> {
	try {
		const expressLoan = await ExpressLoan.findByPk(r.params.id, {
			include: [
				{
					model: ExpressLoanFile,
					separate: true,
				},
				{
					model: User.scope('withSettings'),
					where: {
						status: userStatus.TEMPORARY,
					},
				}
			],
		});
		if (!expressLoan) {
			throw new Exception(Errors.NotFound, 'Express loan not found', {
				expressLoanId: r.params.id,
			});
		}

		return outputOk(expressLoan);
	} catch (err) {
		return handlerError('Failed to retrieve express loans', err);
	}
}

export async function resolve(r: Hapi.Request): Promise<IOutputOk<{ status: string }> | Boom> {
	try {
		const expressLoan = await ExpressLoan.findByPk(r.params.id);
		if (!expressLoan) {
			throw new Exception(Errors.NotFound, 'Express loan not found', {
				expressLoanId: r.params.id,
			});
		}

		expressLoan.update({ status: ExpressLoanStatus.ACTIVE, });
		return outputOk({ status: ExpressLoanStatus.ACTIVE, });
	} catch (err) {
		return handlerError('Failed to resolve express loans', err);
	}
}

export async function destroy(r: Hapi.Request) {
	try {
		const expressLoan = await ExpressLoan.findByPk(r.params.id, {
			include: {
				model: ExpressLoanFile,
			},
		});
		if (!expressLoan) {
			throw new Exception(Errors.NotFound, 'Express loan not found', {
				expressLoanId: r.params.id,
			});
		}

		await ExpressLoanFile.destroy({
			where: {
				expressLoanId: expressLoan.id,
			},
		});
		await expressLoan.destroy();
		return outputEmpty();
	} catch (err) {
		return handlerError('Failed to delete express loans', err);
	}
}
