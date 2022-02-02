import { Lifecycle, } from '@hapi/hapi';
import * as Hapi from '@hapi/hapi';
import {
	UserProfile,
	User,
	Wallet,
	EntrepreneurAccount,
	EntityAccount,
	UserAddress,
	UserDocument,
	UserDocumentPage,
	File,
	UserProfileStatus,
	UserProfileType,
	EntityDocument,
	EntityDocumentPage,
	DocumentPageStatus,
} from 'invest-models';
import { Op, } from 'sequelize';
import { returnUsersLogsTemplate, } from '../templates/usersLogs.template.xls';
import { Exception, handlerError, } from '../utils/error';
import config from '../config/config';
import {
	usersStats,
	queryUsers,
	queryStats,
	queryProfiles,
	queryUserStats,
	queryUsersLogs,
} from '../core/operations/users';
import { returnTemplate, } from '../templates/user.template.xls';
import { output, outputPagination, } from '../utils';
import { Errors, } from '../utils/errors';
import { prepareFileResponse, } from '../utils/helpers';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import { returnUserTemplate, } from '../templates/users.template.xls';

export const listUsers: Lifecycle.Method = async (r) => {
	try {
		const { count, rows, } = await queryUsers(r.query);
		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list users', err);
	}
};

export async function listUsersProfiles(request: Hapi.Request) {
	try {
		const { count, rows, } = await queryProfiles(request.query);
		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list users profiles', err);
	}
}

export const retrieveUserProfiles: Lifecycle.Method = async (r) => {
	try {
		const profile = await UserProfile.scope('withUpdates').findOne({
			where: {
				id: r.params.id,
			},
			include: [
				{
					model: User.scope('withUpdates'),
					include: [
						{ model: UserAddress, },
						{
							model: UserDocument.scope('withUpdates'),
							include: [
								{
									model: UserDocumentPage,
									include: [
										{
											model: File,
										}
									],
								}
							],
						}
					],
				},
				{ model: Wallet, },
				{ model: EntrepreneurAccount.scope('withUpdates'), },
				{ model: EntityAccount.scope('withUpdates'), }
			],
		});
		if (!profile) {
			throw new Exception(Errors.NotFound, 'User profile not found', {});
		}

		let profileOutput: Partial<UserProfile> = profile.toJSON();

		if (
			profile.status === UserProfileStatus.CREATED ||
			profile.status === UserProfileStatus.DRAFT ||
			profile.status === UserProfileStatus.REVIEWING
		) {
			profileOutput = {
				...profileOutput,
				...profileOutput.updates,
			};
		}

		let userOutput: Partial<UserProfile> = profile.toJSON();

		// TODO подумать как определять источник данных, но пока брать отсюда и так
		if (profile.updates) {
			userOutput.email = userOutput.updates.email;
			userOutput.phone = userOutput.updates.phone;
			userOutput = {
				...userOutput,
				...userOutput.updates,
			};
			delete userOutput.updates;
		}

		if (userOutput.user) {
			let user: Partial<User> = profile.user.toJSON();
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

		// TODO придумать нормально, мне не нравятся эти кучи костылей
		// возможно надо реализовать извелечение данных на уровне секвалайза или БД

		if (userOutput.type === UserProfileType.ENTITY) {
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
			userOutput.entityAccount = entityAcc as EntityAccount;
		} else {
			delete userOutput.entityAccount;
		}

		return output({ ...userOutput, } as unknown as UserProfile);
	} catch (err) {
		return handlerError('Failed to retrieve user', err);
	}
};

export async function retrieveUser(r: Hapi.Request) {
	try {
		const user = await User.scope('withUpdates').findOne({
			where: {
				id: r.params.id,
				'$profiles.status$': { [Op.and]: [{ [Op.ne]: 'history', }, { [Op.ne]: 'created', }], },
			},
			include: [
				{ model: UserAddress, },
				{
					model: UserProfile,
					as: 'profiles',
					required: true,
					duplicating: false,
					include: [
						{
							model: EntityAccount,
							include: [
								{
									model: EntityDocument,
									include: [{ 
										model: EntityDocumentPage,
										include: [{
											model: File,
											attributes: ['name']
										}]
								 }],
								}
							],
						}
					],
				},
				{
					model: UserDocument,
					include: [
						{
							model: UserDocumentPage,
							include: [
								{
									model: File,
								}
							],
						}
					],
				}
			],
		});
		if (!user) {
			throw new Exception(Errors.NotFound, 'User not found', {});
		}

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
				delete profile.updates;
			}

			if (profileOut.type === UserProfileType.ENTITY) {
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
			userDocument,
		} as unknown as User;
	} catch (err) {
		return handlerError('Failed to retrieve user', err);
	}
}

export const getUsersStats = async (r) => {
	try {
		const stats = await usersStats();
		return output(stats);
	} catch (err) {
		return handlerError('Failed to show user stats', err);
	}
};

export const listUserProfilesXslx = async (r, h) => {
	try {
		const data = await queryStats(r);
		const name = 'UserProfiles.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnTemplate(data), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to list user profiles', err);
	}
};

export const listUsersXslx = async (r, h) => {
	try {
		const data = await queryUserStats(r.query);
		const name = 'Users.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnUserTemplate(data), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to list users', err);
	}
};

export const listUsersLogs: Lifecycle.Method = async (request: Hapi.Request) => {
	try {
		const response = await queryUsersLogs(request);
		return output(response);
	} catch (err) {
		return handlerError('Failed to list users logs', err);
	}
};

export const listUsersLogsXslx: Lifecycle.Method = async (request: Hapi.Request, h) => {
	try {
		const response = await queryUsersLogs(request);
		const name = 'Users_logs.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnUsersLogsTemplate(response), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to xlsx users logs', err);
	}
};
