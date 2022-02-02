import * as Hapi from '@hapi/hapi';
import { Op, WhereOptions, } from 'sequelize';
import { BankOperation, Loan, LoanIssue, Transaction, } from 'invest-models';
import { Exception, handlerError, } from '../utils/error';
import { filterRange, } from './operations/filterRange';
import { prepareQuery, transformMultiQuery, } from '../utils/helpers';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { output, outputOk, outputPagination, } from '../utils';
import { Errors, } from '../utils/errors';

export async function listInvestments(request: Hapi.Request) {
	try {
		const { from, to, query, status, } = request.query;

		const whereInvestments: WhereOptions = {
			[Op.and]: [],
		};

		if (status) {
			whereInvestments[Op.and].push(filterRange('status', transformMultiQuery(status)));
		}

		if (from || to) {
			whereInvestments[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await LoanIssue.findAndCountAll({
			where: {
				...whereInvestments,
				...prepareQuery(query, ['type']),
			},
			include: [
				{
					model: BankOperation,
				},
				{
					model: Transaction,
				},
				{
					model: Loan,
				}
			],
			distinct: true,
			...order(request),
			...paginate(request),
		});
		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list investments', err);
	}
}

export async function retrieveInvestment(request: Hapi.Request) {
	try {
		const investment = await LoanIssue.findOne({
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
					model: Loan,
				}
			],
		});
		if (!investment) {
			throw new Exception(Errors.NotFound, 'Investmrnt not found');
		}
		return outputOk(investment);
	} catch (err) {
		return handlerError('Failed to retrieve investment', err);
	}
}

export async function createInvestment(request: Hapi.Request) {
	try {
		const { accountNumber, } = request.payload as { accountNumber: string };
		const loan = await Loan.findOne({
			where: {
				contractNumber: accountNumber,
			},
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		// await Loan.update({ status: loanStatus.FINANCED },
		//   { where: { id, status: loanStatus.BANK_CONFIRMATION } });
		await request.server.mqSend('moneybox:issue-loan', {
			loanId: loan.id,
			commission: 1,
			commissionNds: 1,
			purpose: 'Тестирование (с НДС)',
		});
		return output({ msg: 'Status updated', });
	} catch (err) {
		return handlerError('Failed to update loan', err);
	}
}

export default { retrieveInvestment, listInvestments, createInvestment, };
