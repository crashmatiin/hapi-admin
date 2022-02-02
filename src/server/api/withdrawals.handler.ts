import * as Hapi from '@hapi/hapi';
import { BankOperation, Transaction, Wallet, Withdrawal, } from 'invest-models';
import { Op, WhereOptions, } from 'sequelize';
import { Exception, handlerError, } from '../utils/error';
import { prepareQuery, transformMultiQuery, } from '../utils/helpers';
import { output, outputPagination, } from '../utils';
import { filterRange, } from './operations/filterRange';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { Errors, } from '../utils/errors';

export async function listWithdrawals(request: Hapi.Request) {
	try {
		const { from, to, query, status, type, } = request.query;

		const whereWithdrawals: WhereOptions = {
			[Op.and]: [],
		};

		if (status) {
			whereWithdrawals[Op.and].push(filterRange('status', transformMultiQuery(status)));
		}

		if (type) {
			whereWithdrawals[Op.and].push(filterRange('type', transformMultiQuery(type)));
		}

		if (from || to) {
			whereWithdrawals[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await Withdrawal.findAndCountAll({
			where: {
				...whereWithdrawals,
				...prepareQuery(query, ['status', 'type']),
			},
			include: [
				{
					model: BankOperation,
				},
				{
					model: Transaction,
				},
				{
					model: Wallet,
				}
			],
			distinct: true,
			...order(request),
			...paginate(request),
		});

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list withdrawals', err);
	}
}

export async function retrieveWithdrawal(request: Hapi.Request) {
	try {
		const withdrawal = await Withdrawal.findAndCountAll({
			where: {
				id: request.params.id,
			},
			include: [
				{
					model: BankOperation,
				},
				{
					model: Transaction,
				},
				{
					model: Wallet,
				}
			],
		});

		if (!withdrawal) {
			throw new Exception(Errors.NotFound, 'Withdrawal not found', {});
		}

		return output({ withdrawal, });
	} catch (err) {
		return handlerError('Failed to retrieve withdrawals', err);
	}
}
