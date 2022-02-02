/* eslint-disable dot-notation */
import { col, fn, Op, WhereOptions, } from 'sequelize';
import {
	Investment,
	Loan,
	LoanTin,
	LoanUser,
	Payment,
	PaymentStatus,
	User,
	UserDocument,
	UserProfile,
	Wallet,
} from 'invest-models';
import BigNumber from 'bignumber.js';
import { IPaymentWithInvestorStats, } from '../../templates/templates.interfaces';
import { ListBorrowerLoansQueries, ListLoanQueries, LoansStats, } from '../types/loans';
import { filterRange, } from '../../api/operations/filterRange';
import { prepareQuery, transformMultiQuery, } from '../../utils/helpers';
import { order, } from '../../api/operations/order';
import { paginate, } from '../../api/operations/paginate';
import { IListLoansQueries, IListQueries, } from '../../utils/utils.interfaces';
import { handlerError, } from '../../utils/error';

export const queryLoans = async (
	query: ListLoanQueries
): Promise<{ count: number; rows: Loan[] }> => {
	const { status, arrearsStatus, kind, repaymentType, type, from, to, } = query;

	const where: WhereOptions = {
		[Op.and]: [],
	};

	if (status) {
		where[Op.and].push(filterRange('status', transformMultiQuery(status)));
	}

	if (arrearsStatus) {
		where[Op.and].push(filterRange('arrearsStatus', transformMultiQuery(arrearsStatus)));
	}

	if (kind) {
		where[Op.and].push(filterRange('kind', transformMultiQuery(kind)));
	}

	if (repaymentType) {
		where[Op.and].push(filterRange('repaymentType', transformMultiQuery(repaymentType)));
	}

	if (type) {
		where[Op.and].push(filterRange('type', transformMultiQuery(type)));
	}

	if (from) {
		where[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await Loan.findAndCountAll({
		where: {
			...where,
			...prepareQuery(query.query, ['name']),
		},
		include: [
			{
				model: User,
				as: 'user',
				attributes: ['email'],
				include: [
					{
						model: UserDocument,
						attributes: ['tin'],
					}
				],
			},
			{
				model: UserProfile,
				include: [
					{
						model: Wallet,
						// attributes: ['requisites', 'accountNumber'],
					}
				],
				attributes: ['email'],
			},
			{
				model: LoanTin,
				attributes: ['tin'],
			}
		],
		attributes: [
			'id',
			'number',
			'firstName',
			'lastName',
			'middleName',
			'status',
			'type',
			'expirationDate',
			'repaymentType',
			'kind',
			'minGoal',
			'maxGoal',
			'term',
			'currentFunds',
			'commitment',
			'conclusionContractDate',
			'expirationContractDate',
			'name',
			'contractNumber',
			'interestRate',
			'arrearsStatus',
			'createdAt'
		],
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});

	return { count, rows, };
};

export async function loansStats(): Promise<LoansStats> {
	const { count: countLoans, rows: loans, } = await Loan.findAndCountAll({
		attributes: [
			[fn('sum', col('Loan.paid')), 'paid'],
			[fn('sum', col('Loan.debt')), 'debt']
		],
		raw: true,
		distinct: true,
	});
	const loanStats: LoansStats = {
		total: countLoans,
		sum: Number(loans[0].paid) + Number(loans[0].debt),
	};
	return loanStats;
}

export const queryInvestors = async (
	query: IListQueries,
	id: string
): Promise<{ count: number; rows: User[] }> => {
	const loan = await Loan.findOne({
		where: {
			id,
		},
		include: [
			{
				model: User,
				as: 'investors',
				include: [
					{
						model: UserDocument,
						attributes: ['tin'],
					},
					{
						model: UserProfile,
						include: [
							{
								model: Wallet,
								attributes: ['requisites'],
							}
						],
						attributes: ['id', 'status', 'email', 'phone'],
					}
				],
				attributes: ['lastName', 'firstName', 'middleName'],
			}
		],
		attributes: ['id'],
	});

	const investorsCount = await LoanUser.count({
		where: {
			loanId: id,
		},
	});

	return { count: investorsCount, rows: loan.investors, };
};

export async function queryPaymentsWithInvestments(
	query: IListLoansQueries,
	loanId: string,
	userId?: string
): Promise<{ count: number; rows: Array<Payment | IPaymentWithInvestorStats> }> {
	const { scheduleVersion, } = query;
	const where: WhereOptions = {
		[Op.and]: [],
	};

	if (scheduleVersion) {
		where[Op.and].push(filterRange('scheduleVersion', transformMultiQuery(scheduleVersion)));
		where[Op.and].push({
			[Op.or]: [{ status: PaymentStatus.Executed, }, { status: PaymentStatus.Outdated, }],
		});
	}

	const { count, rows, } = await Payment.findAndCountAll({
		where: {
			...prepareQuery(query.query, []),
			...where,
			loanId,
		},
		include: [
			{
				model: Investment,
				as: 'investment',
				include: [
					{
						model: User,
						as: 'user',
					}
				],
			},
			{
				model: Loan,
				as: 'loan',
			}
		],
		...order({ query, }),
		...paginate({ query, }),
	});

	const paymentStats = await Promise.all(
		rows.map(async (payment): Promise<IPaymentWithInvestorStats | Payment> => {
			if (!payment.investment || !userId) {
				return payment;
			}

			const userInvestments = await Investment.findAll({
				where: {
					[Op.and]: [{ userId, }, { loanId, }],
				},
				include: [
					{
						model: User,
						as: 'user',
					}
				],
			});

			let allInvested = new BigNumber(0);

			userInvestments.forEach((investment) => {
				allInvested = allInvested.plus(investment.value);
			});

			const percent = allInvested.dividedBy(payment.loan.currentFunds);
			const percentInt = percent.multipliedBy(100).integerValue();
			const paymentAmount = percent.multipliedBy(payment.amount);

			const item = payment.toJSON();
			item['investorsPercent'] = percentInt;
			item['paymentInvestorAmount'] = paymentAmount;

			const stats = item as IPaymentWithInvestorStats;
			return stats;
		})
	);

	return { count, rows: paymentStats, };
}

export const queryBorrowerLoans = async (
	query: ListBorrowerLoansQueries,
	id: string
): Promise<{ count: number; rows: Loan[] }> => {
	const { status, from, to, } = query;

	const where: WhereOptions = {
		[Op.and]: [],
	};

	if (status) {
		where[Op.and].push(filterRange('status', transformMultiQuery(status)));
	}

	if (from) {
		where[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await Loan.findAndCountAll({
		where: {
			...where,
			profileId: id,
			...prepareQuery(query.query, [
				'number',
				'name',
				'firstName',
				'lastName',
				'middleName',
				'term',
				'currentFunds',
				'minGoal',
				'maxGoal',
				'paid',
				'debt',
				'status',
				'interestRate',
				'type'
			]),
		},
		...order({ query, }),
		...paginate({ query, }),
		attributes: [
			'id',
			'number',
			'minGoal',
			'maxGoal',
			'paid',
			'debt',
			'expirationDate',
			'name',
			'conclusionContractDate',
			'expirationContractDate',
			'currentFunds',
			'firstName',
			'lastName',
			'middleName'
		],
		distinct: true,
	});
	return { count, rows, };
};
