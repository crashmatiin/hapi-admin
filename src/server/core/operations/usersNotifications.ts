/* eslint-disable dot-notation */
import { Op, WhereOptions, } from 'sequelize';
import {
	Loan,
	Notification,
	NotificationUser,
	User,
	UserDocument,
	UserProfile,
} from 'invest-models';
import { ListUsersNotificationsQueries, UsersGroupsPayload, } from '../types/usersNotifications';
import { prepareQuery, transformMultiQuery, } from '../../utils/helpers';
import { order, } from '../../api/operations/order';
import { paginate, } from '../../api/operations/paginate';
import { filterRange, } from '../../api/operations/filterRange';

export const queryUsersNotifications = async (
	query: ListUsersNotificationsQueries
): Promise<{ count: number; rows: NotificationUser[] }> => {
	const { from, to, status, verificationStatus, type, } = query;

	const where: WhereOptions = {
		[Op.and]: [],
	};

	if (status) {
		where[Op.and].push(filterRange('$notification.users.status$', transformMultiQuery(status)));
	}

	if (type) {
		where[Op.and].push(filterRange('$notification.type$', transformMultiQuery(type)));
	}

	if (verificationStatus) {
		where[Op.and].push(
			filterRange(
				'$notification.users.verificationStatus$',
				transformMultiQuery(verificationStatus)
			)
		);
	}

	if (from || to) {
		where[Op.and].push({
			createdAt: {
				[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
			},
		});
	}

	const { count, rows, } = await NotificationUser.findAndCountAll({
		where: {
			...where,
			...prepareQuery(query.query, ['$notification.users.email$', '$notification.type$']),
		},
		include: [
			{
				model: Notification,
				as: 'notification',
				attributes: ['notification', 'type'],
				required: true,
				duplicating: false,
				include: [
					{
						model: User,
						as: 'users',
						attributes: [
							'id',
							'email',
							'firstName',
							'middleName',
							'lastName',
							'createdAt',
							'updatedAt',
							'status',
							'verificationStatus'
						],
						required: true,
						duplicating: false,
						include: [
							{
								model: Loan,
								as: 'loans',
								attributes: ['number'],
								separate: true,
							},
							{
								model: UserDocument,
								attributes: ['tin'],
							}
						],
					}
				],
			}
		],
		attributes: ['notificationId', 'status', 'createdAt', 'updatedAt'],
		distinct: true,
		...order({ query, }),
		...paginate({ query, }),
	});

	return { count, rows, };
};

export const queryUsersByGroups = async (groups: UsersGroupsPayload | null) => {
	let options;
	if (groups) {
		const { status, VerificationStatus, UserProfileRole, UserProfileType, } = groups;
		options = {
			include: [
				{
					model: UserProfile,
					where: {
						role: {
							[Op.in]: UserProfileRole ? groups.UserProfileRole : [],
						},
						type: {
							[Op.in]: UserProfileType ? groups.UserProfileType : [],
						},
						status: {
							[Op.in]: status ? groups.status : [],
						},
					},
					include: [
						{
							model: User,
							where: {
								verificationStatus: {
									[Op.in]: VerificationStatus ? groups.VerificationStatus : [],
								},
							},
						}
					],
				}
			],
		};
	}

	return User.findAll(options);
};
