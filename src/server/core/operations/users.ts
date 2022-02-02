import * as Hapi from '@hapi/hapi';
import { Boom, } from '@hapi/boom';
import {
	User,
	userRole,
	UserProfile,
	Wallet,
	UserAddress,
	UserDocument,
	UserProfileType,
	EntityAccount,
	EntityDocument,
	EntityDocumentPage,
  File,
} from 'invest-models';
import { col, fn, Op, WhereOptions, } from 'sequelize';
import { LoggerRetrieveMqRequest, } from 'mq-plugin/protocols';
import { IListQueries, } from '../../utils/utils.interfaces';
import { handlerError, } from '../../utils/error';
import { filterRange, } from '../../api/operations/filterRange';
import { order, } from '../../api/operations/order';
import { paginate, } from '../../api/operations/paginate';
import { prepareQuery, transformMultiQuery, } from '../../utils/helpers';
import {
	IUsersNumericStats,
	IUserProfilesStats,
	ListUsersQueries,
	IUsersStats,
} from '../types/users';

export async function usersStats(): Promise<IUsersNumericStats> {
	const { count: countUsers, } = await User.findAndCountAll();
	const { count: countInvestors, } = await UserProfile.findAndCountAll({
		where: { role: userRole.INVESTOR, },
		attributes: ['id'],
	});
	const users = await User.findAll({
		attributes: ['status', [fn('count', col('User.status')), 'count']],
		group: ['status'],
		raw: true,
	});
	const stats: IUsersNumericStats = {
		total: countUsers,
		active: 0,
		verified: 0,
		investors: countInvestors,
		banned: 0,
	};
	users.forEach((item) => {
		// eslint-disable-next-line dot-notation
		stats[item.status] = Number(item['count']);
	});
	return stats;
}

export async function queryStats(filters): Promise<IUserProfilesStats> {
	const { query, } = filters.query;
	let where = {};
	where = { ...where, ...prepareQuery(query, ['status', 'verificationStatus']), };

	const { count: countUsers, rows, } = await UserProfile.findAndCountAll({
		where,
		include: [
			{
				model: User,
				include: [{ model: UserAddress, }],
			},
			{ model: Wallet, }
		],
		distinct: true,
		...order(filters),
		...paginate(filters),
	});
	const { count: countInvestors, } = await UserProfile.findAndCountAll({
		where: { role: userRole.INVESTOR, },
	});
	// const res = await UserProfile.findAll({
	//   attributes: ['verificationStatus', [fn('count', col('UserProfile.verificationStatus')), 'count']],
	//   group: ['verificationStatus'],
	//   raw: true,
	// });
	const stats: IUsersNumericStats = {
		total: countUsers,
		active: 0,
		verified: 0,
		investors: countInvestors,
		banned: 0,
	};
	// FIXME UserProfile hasnt verificationStatus
	// res.forEach((item) => {
	//   // eslint-disable-next-line dot-notation
	//   stats[item.verificationStatus] = Number(item['count']);
	// });
	return {
		users: rows,
		stats,
	};
}

export async function queryUserStats(query: IListQueries): Promise<IUsersStats> {
	const where = { ...prepareQuery(query.query, ['status', 'verificationStatus']), };

	const { count: countUsers, rows, } = await User.findAndCountAll({
		where,
		include: [{ model: UserAddress, }],
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});

	const res = await User.findAll({
		attributes: ['status', [fn('count', col('status')), 'count']],
		group: ['status'],
		raw: true,
	});

	const stats: IUsersNumericStats = {
		total: countUsers,
		// @ts-ignore
		active: res[0]?.count || 0,
		verified: 0,
		// @ts-ignore
		banned: res[1]?.count || 0,
	};
	res.forEach((item) => {
		// eslint-disable-next-line dot-notation
		stats[item.verificationStatus] = Number(item['count']);
	});
	return {
		users: rows,
		stats,
	};
}

export const queryUsers = async (
	query: ListUsersQueries
): Promise<{ count: number; rows: User[] }> => {
	const { status, verification, from, to, } = query;

	const whereProfiles: WhereOptions = {
		[Op.and]: [],
	};
	if (status) {
		whereProfiles[Op.and].push(filterRange('status', transformMultiQuery(status)));
	}

	if (verification) {
		whereProfiles[Op.and].push(
			filterRange('verificationStatus', transformMultiQuery(verification))
		);
	}

	const whereUserName: WhereOptions = {
		[Op.and]: [],
	};

	if (query.query) {
		const fullNameArr = query.query.split(' ');
		if (fullNameArr.length > 1) {
			fullNameArr.forEach((name) => {
				whereUserName[Op.and].push({
					[Op.or]: [{ firstName: name, }, { middleName: name, }, { lastName: name, }],
				});
			});
		}
	}

	if (from || to) {
		whereProfiles[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await User.scope('withUpdates').findAndCountAll({
		include: [
			{
				model: UserProfile.scope('withUpdates'),
				as: 'profiles',
				where: {
					status: {
						[Op.and]: [{ [Op.ne]: 'history', }, { [Op.ne]: 'created', }],
					},
				},
				include: [
					{
						model: Wallet,
						attributes: ['requisites'],
					},
					{
						model: EntityAccount.scope('withUpdates'),
						include: [
							{
								model: EntityDocument.scope('withUpdates'),
								include: [{
                  model: EntityDocumentPage,
                  include: [{
                    model: File,
                    attributes: ['name']
                  }],
                }],
							}
						],
					}
				],
				attributes: [
					'id',
					'email',
					'role',
					'phone',
					'type',
					'status',
					'createdAt',
					'updatedAt',
					'updates'
				],
			},
			{
				model: UserDocument,
				attributes: ['tin'], // добавить паспортные данные
			}
		],
		where:
			whereUserName[Op.and].length > 0
				? {
					...whereUserName,
				  }
				: {
					...whereProfiles,
					...prepareQuery(query.query, ['email', 'firstName', 'middleName', 'lastName']),
				  },
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});

	const updatedRows = await Promise.all(
		rows.map(async (user) => {
			let userOutput: Partial<User> = user.toJSON();
			let userDocument: Partial<UserDocument> = user.userDocument
				? user.userDocument.toJSON()
				: undefined;
			// TODO подумать как определять источник данных, но пока брать отсюда и так
			if (user.updates) {
				userOutput = {
					...userOutput,
					...userOutput.updates,
					fullName: `${userOutput.updates.lastName} ${userOutput.updates.firstName} ${userOutput.updates.middleName}`,
				};
				delete userOutput.updates;
			}

			if (user.userDocument) {
				userDocument = {
					...userDocument,
					...userDocument.updates,
				};
				delete userDocument.updates;
			}
			// TODO придумать нормально, мне не нравятся эти кучи костылей
			// возможно надо реализовать извелечение данных на уровне секвалайза или БД
			userOutput.profiles = user.profiles.map((profile) => {
				const profileOut: Partial<UserProfile> = profile.toJSON();
				if (profile.updates) {
					profileOut.email = profile.updates?.email;
					profileOut.phone = profile.updates?.phone;
					delete profileOut.updates;
				}

				if (profile.type === UserProfileType.ENTITY) {
					let entityAcc: Partial<EntityAccount> = profile.entityAccount.toJSON();
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
					profileOut.entityAccount = entityAcc as EntityAccount;
				} else {
					delete profileOut.entityAccount;
				}

				return profileOut;
			}) as Partial<UserProfile[]>;
			return {
				...userOutput,
				...userDocument,
			} as unknown as User;
		})
	);

	return { count, rows: updatedRows, };
};

export async function queryProfiles(
	query: ListUsersQueries
): Promise<{ count: number; rows: UserProfile[] }> {
	const { status, role, type, from, to, } = query;

	const whereProfiles: WhereOptions = {
		[Op.and]: [],
	};

	if (status) {
		whereProfiles[Op.and].push(filterRange('status', transformMultiQuery(status)));
	}

	if (role) {
		whereProfiles[Op.and].push(filterRange('role', transformMultiQuery(role)));
	}

	if (type) {
		whereProfiles[Op.and].push(filterRange('type', transformMultiQuery(type)));
	}

	if (from || to) {
		whereProfiles[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await UserProfile.scope('withUpdates').findAndCountAll({
		include: [
			{
				model: EntityAccount.scope('withUpdates'),
				include: [
					{
						model: EntityDocument.scope('withUpdates'),
						include: [{
              model: EntityDocumentPage,
              include: [{
                model: File,
                attributes: ['name']
              }]
            }],
					}
				],
			},
			{
				model: Wallet,
				attributes: ['requisites'],
			},
			{
				model: User.scope('withUpdates'),
				include: [
					{
						model: UserDocument.scope('withUpdates'),
						attributes: ['tin', 'updates'],
					}
				],
			}
		],
		where: {
			status: {
				[Op.and]: [{ [Op.ne]: 'history', }, { [Op.ne]: 'created', }],
			},
			...whereProfiles,
			...prepareQuery(query.query, ['phone', 'email', 'rating']),
		},
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});

	const updatedRows = await Promise.all(
		rows.map(async (userProfile) => {
			let userOutput: Partial<UserProfile> = userProfile.toJSON();
      let userDocument: Partial<UserDocument> = userProfile.user?.userDocument
				? userProfile.user?.userDocument.toJSON()
				: undefined;

			if (userProfile.updates) {
				userOutput = {
					...userOutput,
					...userOutput.updates,
				};
				delete userOutput.updates;
			}

			if (userProfile.user) {
				let user: Partial<User> = userProfile.user.toJSON();
        if (userProfile.user.updates) {
					user = {
						...user,
						...user.updates,
					};
					delete user.updates;
					userOutput.user = user as User;
        }
          if (userProfile.user.userDocument) {
            userDocument = {
              ...userDocument,
              ...userDocument.updates,
            };
            delete userDocument.updates;
            userOutput.user.userDocument = userDocument as UserDocument;
          }
			} else {
				delete userOutput.user;
			}

			if (userProfile.type === UserProfileType.ENTITY) {
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
}

export const queryUsersLogs = async (request: Hapi.Request): Promise<any> => {
	const response = await request.server.mqCall<LoggerRetrieveMqRequest>('logs:read', {
		tag: '1...',
		limit: Number(request.query.limit),
		offset: Number(request.query.offset),
		query: request.query.query,
		sort: request.query.order,
	});
	return response;
};
