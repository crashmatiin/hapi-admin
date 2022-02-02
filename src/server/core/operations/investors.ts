import { Server, } from '@hapi/hapi';
import {
	Investment,
	UserProfile,
	userRole,
	Loan,
	User,
	Wallet,
	UserDocument,
	LoanStatus,
	EntityAccount,
	UserProfileStatus,
	UserProfileType,
	EntityDocument,
	EntityDocumentPage,
	File,
} from 'invest-models';
import { col, fn, Op, WhereOptions, } from 'sequelize';
import { Boom, } from '@hapi/boom';
import { handlerError, } from '../../utils/error';
import { filterRange, } from '../../api/operations/filterRange';
import { order, } from '../../api/operations/order';
import { paginate, } from '../../api/operations/paginate';
import { prepareQuery, transformMultiQuery, } from '../../utils/helpers';
import { IListParams, } from '../types/generic';
import {
	IInvestorsNumericStats,
	IInvestorsStats,
	ListInvestorProjectsHoldQueries,
	ListInvestorProjectsQueries,
	ListInvestorsQueries,
} from '../types/investors';

export async function queryStats(server: Server, filters: IListParams): Promise<IInvestorsStats> {
	const { query, limit, offset, } = filters;
	let where: WhereOptions = { role: userRole.INVESTOR, };
	where = { ...where, ...prepareQuery(query, ['status', 'verificationStatus']), };

	const { count, rows, } = await UserProfile.findAndCountAll({
		where,
		include: [
			{
				model: User,
				attributes: ['lastName', 'firstName', 'middleName'],
				include: [
					{
						model: UserDocument,
						attributes: ['tin'],
					}
				],
			},
			{
				model: Wallet,
				attributes: { include: ['requisites'], },
			}
		],
		distinct: true,
		attributes: ['status', 'verificationStatus', 'email', 'type'],
	});
	// const res = await UserProfile.findAll({
	//   attributes: ['verificationStatus', [fn('count', col('UserProfile.verificationStatus')), 'count']],
	//   group: ['verificationStatus'],
	//   raw: true,
	// });
	const investors = await Investment.findAll({
		attributes: [[fn('sum', col('Investment.value')), 'value']],
		raw: true,
	});
	const loans = await Loan.findAll({
		attributes: [
			[fn('sum', col('Loan.debt')), 'debt'],
			[fn('sum', col('Loan.paid')), 'paid']
		],
		raw: true,
	});
	const investedTotal = Number(investors[0].value);
	const loansLeft = Number(loans[0].debt);
	const loansPaid = Number(loans[0].paid);
	const stats: IInvestorsNumericStats = {
		active: 0,
		verified: 0,
		banned: 0,
		investedTotal,
		loansLeft,
		total: count,
		loansPaid,
	};
	// FIXME UserProfile hasnt verificationStatus
	// res.forEach((item) => {
	//   // eslint-disable-next-line dot-notation
	//   stats[item.verificationStatus] = Number(item['count']);
	// });
	return {
		investors: rows,
		stats,
	};
}

export async function queryInvestors(
	query: ListInvestorsQueries
): Promise<{ count: number; rows: UserProfile[] } | Boom> {
	try {
		const { status, from, to, } = query;

		const where: WhereOptions = {
			[Op.and]: [
				{
					role: userRole.INVESTOR,
					status: {
						[Op.in]: [
							UserProfileStatus.ACCEPTED,
							UserProfileStatus.REJECTED,
							UserProfileStatus.REVIEWING
						],
					},
				}
			],
		};

		const whereUserName: WhereOptions = {
			[Op.and]: [
				{
					role: userRole.INVESTOR,
					status: {
						[Op.in]: [
							UserProfileStatus.ACCEPTED,
							UserProfileStatus.REJECTED,
							UserProfileStatus.REVIEWING
						],
					},
				}
			],
		};

		if (status) {
			where[Op.and].push(filterRange('status', transformMultiQuery(status)));
			whereUserName[Op.and].push(filterRange('status', transformMultiQuery(status)));
		}

		if (from || to) {
			where[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
			whereUserName[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		let fullNameArr: string[] = [];
		if (query.query) {
			fullNameArr = query.query.split(' ');
			if (fullNameArr.length > 1) {
				fullNameArr.forEach((name) => {
					whereUserName[Op.and].push({
						[Op.or]: [
							{ '$user.firstName$': name, },
							{ '$user.middleName$': name, },
							{ '$user.lastName$': name, }
						],
					});
				});
			}
		}

		where[Op.and].push({
			...prepareQuery(query.query, [
				'email',
				'phone',
				'$user.firstName$',
				'$user.lastName$',
				'$user.middleName$'
			]),
		});

		const { count, rows, } = await UserProfile.scope('withUpdates').findAndCountAll({
			where:
				fullNameArr.length > 1
					? { ...whereUserName, }
					: {
						...where,
					  },
			include: [
				{
					model: User.scope('withUpdates'),
					as: 'user',
					attributes: ['lastName', 'firstName', 'middleName', 'updates'],
					include: [
						{
							model: UserDocument,
							attributes: ['tin'],
						}
					],
				},
				{
					model: Wallet,
					attributes: ['balance', 'invested', 'flow', 'available', 'requisites', 'accountNumber'],
				},
				{
					model: EntityAccount.scope('withUpdates'),
					attributes: ['id', 'fullName', 'shortName', 'tin', 'email', 'updates'],
					include: [
						{
							model: EntityDocument.scope('withUpdates'),
							include: [{ 
								model: EntityDocumentPage,
								include: [{
									model: File,
									attributes: ['name'],
								}],
							}],
						}
					],
				}
			],
			distinct: true,
			attributes: ['id', 'status', 'email', 'type', 'role', 'createdAt', 'updates'],
			...order({ query, }),
			...paginate({ query, }),
		});

		const updatedRows = await Promise.all(
			rows.map(async (userProfile) => {
				let userOutput: Partial<UserProfile> = userProfile.toJSON();

				// TODO подумать как определять источник данных, но пока брать отсюда и так
				if (userProfile.updates) {
					userOutput.email = userOutput.updates.email;
					userOutput.phone = userOutput.updates.phone;
					userOutput = {
						...userOutput,
						...userOutput.updates,
					};
					delete userOutput.updates;
				}

				if (userOutput.user) {
					let user: Partial<User> = userProfile.user.toJSON();
					if (user.updates) {
						user = {
							...user,
							...user.updates,
						};
						delete user.updates;
						userOutput.user = user as User;
					}
				} else {
					delete userOutput.user;
				}

				if (userOutput.type === UserProfileType.ENTITY) {
					let entityAcc: Partial<EntityAccount> = userProfile.entityAccount.toJSON();
					entityAcc = {
						...entityAcc,
						...entityAcc.updates,
					};
					delete entityAcc.updates;

					if (entityAcc.entityDocument) {
						let entityAccDocs: Partial<EntityDocument> = entityAcc.entityDocument;
						entityAccDocs = {
							...entityAccDocs,
							...entityAccDocs.updates,
						};
						delete entityAccDocs.updates;

						entityAcc.entityDocument = entityAccDocs as EntityDocument;
					}
					userOutput.entityAccount = entityAcc as EntityAccount;
				} else {
					delete userOutput.entityAccount;
				}

				return {
					...userOutput,
				} as unknown as UserProfile;
			})
		);

		return { count, rows: updatedRows, };
	} catch (err) {
		return handlerError('Failed to get investors', err);
	}
}

export async function investorsStats(
	server: Server,
	filters: IListParams
): Promise<IInvestorsNumericStats | Boom> {
	try {
		const { query, limit, offset, } = filters;
		let where: WhereOptions = { role: userRole.INVESTOR, };
		where = { ...where, ...prepareQuery(query, ['status', 'verificationStatus']), };

		const { count, } = await UserProfile.findAndCountAll({
			where,
			include: [
				{
					model: User,
					attributes: ['lastName', 'firstName', 'middleName'],
					include: [
						{
							model: UserDocument,
							attributes: ['tin'],
						}
					],
				},
				{
					model: Wallet,
					attributes: { include: ['requisites'], },
				}
			],
			distinct: true,
			attributes: ['status', 'email'],
		});
		// const res = await UserProfile.findAll({
		//   attributes: ['verificationStatus', [fn('count', col('UserProfile.verificationStatus')), 'count']],
		//   group: ['verificationStatus'],
		//   raw: true,
		// });
		const investors = await Investment.findAll({
			attributes: [[fn('sum', col('Investment.value')), 'value']],
			raw: true,
		});
		const loans = await Loan.findAll({
			attributes: [
				[fn('sum', col('Loan.debt')), 'debt'],
				[fn('sum', col('Loan.paid')), 'paid']
			],
			raw: true,
		});
		const investedTotal = Number(investors[0].value);
		const loansLeft = Number(loans[0].debt);
		const loansPaid = Number(loans[0].paid);
		const stats: IInvestorsNumericStats = {
			active: 0,
			verified: 0,
			banned: 0,
			investedTotal,
			loansLeft,
			total: count,
			loansPaid,
		};
		// FIXME UserProfile hasnt verificationStatus
		// res.forEach((item) => {
		//   // eslint-disable-next-line dot-notation
		//   stats[item.verificationStatus] = Number(item['count']);
		// });
		return stats;
	} catch (err) {
		return handlerError('Failed to get investors stats', err);
	}
}

export async function queryInvestorProjects(
	query: ListInvestorProjectsQueries
): Promise<{ count: number; rows: Loan[] }> {
	const { status, arrearsStatus, from, to, } = query;

	const where: WhereOptions = {
		[Op.and]: [
			{
				status: {
					[Op.in]: [LoanStatus.CLOSED, LoanStatus.FINANCED],
				},
			}
		],
	};

	if (status) {
		where[Op.and].push(filterRange('status', transformMultiQuery(status)));
	}

	if (arrearsStatus) {
		where[Op.and].push(filterRange('arrearsStatus', transformMultiQuery(arrearsStatus)));
	}

	if (from || to) {
		where[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await Loan.findAndCountAll({
		where: {
			...where,
			...prepareQuery(query.query, ['number', 'firstName', 'lastName', 'middleName', 'name']),
		},
		include: [
			{
				model: User,
				as: 'investors',
			}
		],
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});
	return { count, rows, };
}

export async function queryInvestorProjectsHold(
	query: ListInvestorProjectsHoldQueries
): Promise<{ count: number; rows: Loan[] }> {
	const { from, to, } = query;

	const where: WhereOptions = {
		[Op.and]: [
			{
				status: {
					[Op.in]: [LoanStatus.ACTIVE, LoanStatus.BANK_CONFIRMATION],
				},
			}
		],
	};

	if (from || to) {
		where[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const loans = await Loan.findAll({
		where: {
			...where,
			...prepareQuery(query.query, []),
		},
		include: [
			{
				model: User,
				as: 'investors',
			}
		],
		...order({ query, }),
		...paginate({ query, }),
	});
	return { count: loans.length, rows: loans, };
}
