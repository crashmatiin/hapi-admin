/* eslint-disable dot-notation */
import { col, fn, Op, WhereOptions, } from 'sequelize';
import {
	Loan,
	userRole,
	UserProfile,
	User,
	Wallet,
	UserAddress,
	UserDocument,
	UserProfileStatus,
	EntityAccount,
	UserProfileType,
	EntityDocument,
	EntityDocumentPage,
	File,
} from 'invest-models';
import { ListBorrowersQueries, } from '../types/borrowers';
import { filterRange, } from '../../api/operations/filterRange';
import { prepareQuery, transformMultiQuery, } from '../../utils/helpers';
import { order, } from '../../api/operations/order';
import { paginate, } from '../../api/operations/paginate';
import { UserStats, } from '../types/generic';
import { UserProfileWithLoansStats, } from '../../templates/templates.interfaces';
import { handlerError, } from '../../utils/error';

export const queryBorrowers = async (
	query: ListBorrowersQueries
): Promise<{ count: number; rows: UserProfileWithLoansStats[] }> => {
	const { status, paidExpired, arrearsStatus, from, to, } = query;

	const where: WhereOptions = {
		[Op.and]: [
			{
				role: userRole.BORROWER,
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

	const whereLoans: WhereOptions = {};

	if (from || to) {
		whereLoans.createdAt = {
			[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
		};
	}

	const whereUserName: WhereOptions = {
		[Op.and]: [
			{
				role: userRole.BORROWER,
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

	if (paidExpired) {
		where[Op.and].push({
			settings: {
				paidExpired: {
					[Op.eq]: true,
				},
			},
		});
		whereUserName[Op.and].push({
			settings: {
				paidExpired: {
					[Op.eq]: true,
				},
			},
		});
	}

	if (arrearsStatus) {
		where[Op.and].push({
			arrearsStatus: {
				[Op.eq]: true,
			},
		});
		whereUserName[Op.and].push({
			arrearsStatus: {
				[Op.eq]: true,
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
		where: fullNameArr.length > 1 ? { ...whereUserName, } : { ...where, },
		include: [
			{
				model: User.scope('withUpdates'),
				as: 'user',
				required: true,
				duplicating: false,
				attributes: ['lastName', 'firstName', 'middleName', 'fullName', 'updates'],
				include: [
					{
						model: UserDocument,
						attributes: ['tin'],
					}
				],
			},
			{
				model: Loan,
				as: 'loans',
				where: whereLoans,
				required: !!whereLoans.createdAt,
				separate: true,
				attributes: ['id', 'number', 'paid', 'debt', 'minGoal', 'maxGoal', 'createdAt'],
			},
			{
				model: Wallet,
				as: 'wallet',
				attributes: ['requisites', 'accountNumber'],
			},
			{
				model: EntityAccount.scope('withUpdates'),
				as: 'entityAccount',
				attributes: ['id', 'fullName', 'shortName', 'tin', 'email', 'updates'],
				include: [
					{
						model: EntityDocument.scope('withUpdates'),
						as: 'entityDocument',
						include: [
							{
								model: EntityDocumentPage,
								as: 'entityDocumentPages',
								separate: true,
								include: [{ 
									model: File,
									attributes: ['name'],
								}],
							}
						],
					}
				],
			}
		],
		attributes: ['id', 'status', 'email', 'phone', 'settings', 'type', 'createdAt', 'updates'],
		distinct: true,
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

			// TODO придумать нормально, мне не нравятся эти кучи костылей
			// возможно надо реализовать извелечение данных на уровне секвалайза или БД

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
	// TODO refactor this or make as a database query
	const _rows = updatedRows.map((_item) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		_item.loansStats = _item.loans.reduce(
			(prev, current) => ({
				paid: prev.paid + Number(current.paid || 0),
				debt: prev.debt + Number(current.debt || 0),
				minGoal: prev.minGoal + Number(current.minGoal || 0),
				maxGoal: prev.maxGoal + Number(current.maxGoal || 0),
			}),
			{
				paid: 0,
				debt: 0,
				minGoal: 0,
				maxGoal: 0,
			}
		);
		return _item as UserProfileWithLoansStats;
	});

	return { count, rows: _rows, };
};

export async function borrowerStats(): Promise<UserStats> {
	const { count: countBorrowers, } = await UserProfile.findAndCountAll({
		where: { role: userRole.BORROWER, },
		include: [
			{
				model: User,
				include: [{ model: UserAddress, }, { model: UserDocument, }],
			},
			{
				model: Wallet,
				attributes: { include: ['requisites'], },
			}
		],
		distinct: true,
	});
	// const borrowers = await UserProfile.findAll({
	//   attributes: ['verificationStatus', [fn('count', col('UserProfile.verificationStatus')), 'count']],
	//   group: ['verificationStatus'],
	//   raw: true,
	// });
	const loans = await Loan.findAll({
		attributes: [
			[fn('sum', col('Loan.paid')), 'paid'],
			[fn('sum', col('Loan.debt')), 'debt']
		],
		raw: true,
	});
	const borrowersStats: UserStats = {
		active: 0,
		verified: 0,
		total: countBorrowers,
		banned: 0,
		sum: 0,
		paid: 0,
		debt: 0,
	};
	borrowersStats['sum'] = Number(loans[0].paid) + Number(loans[0].debt);
	borrowersStats['paid'] = Number(loans[0].paid);
	borrowersStats['debt'] = Number(loans[0].debt);
	// FIXME UserProfile hasnt verificationStatus
	// borrowers.forEach((item) => {
	//   borrowersStats[item.verificationStatus] = Number(item['count']);
	// });
	return borrowersStats;
}
