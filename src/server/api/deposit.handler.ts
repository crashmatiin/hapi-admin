import * as Hapi from '@hapi/hapi';
import { BankOperation, Deposit, Transaction, Wallet, } from 'invest-models';
import { Op, WhereOptions, } from 'sequelize';
import { Exception, handlerError, } from '../utils/error';
import { prepareQuery, transformMultiQuery, } from '../utils/helpers';
import { output, outputPagination, } from '../utils';
import { filterRange, } from './operations/filterRange';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { Errors, } from '../utils/errors';

export async function listDeposits(request: Hapi.Request) {
	try {
		const { from, to, query, status, } = request.query;

		const whereDeposits: WhereOptions = {
			[Op.and]: [],
		};

		if (status) {
			whereDeposits[Op.and].push(filterRange('status', transformMultiQuery(status)));
		}

		if (from || to) {
			whereDeposits[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await Deposit.findAndCountAll({
			where: {
				...whereDeposits,
				...prepareQuery(query, [
					'status',
					'requestData.name',
					'requestData.inn',
					'requestData.bik'
				]),
			},
			distinct: true,
			...order(request),
			...paginate(request),
		});

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list deposits', err);
	}
}

export async function retrieveDeposit(request: Hapi.Request) {
	try {
		const deposit = await Deposit.findAndCountAll({
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

		if (!deposit) {
			throw new Exception(Errors.NotFound, 'Deposit not found', {});
		}

		return output({ deposit, });
	} catch (err) {
		return handlerError('Failed to retrieve deposit', err);
	}
}
