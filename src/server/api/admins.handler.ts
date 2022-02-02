import { Lifecycle, } from '@hapi/hapi';
import { Boom, } from '@hapi/boom';
import { Admin, AdminRole, } from 'invest-models';
import { Op, } from 'sequelize';
import * as Hapi from '@hapi/hapi';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import config from '../config/config';
import { Exception, handlerError, } from '../utils/error';
import { IAdminRole, IUpdateAdminFields, } from '../core/types/admins';
import { output, outputPagination, } from '../utils';
import { Errors, ErrorsMessages, } from '../utils/errors';
import { prepareFileResponse, prepareQuery, } from '../utils/helpers';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { queryAdminsLogs, } from '../core/operations/admins';
import { returnAdminsLogsTemplate, } from '../templates/adminsLogs.template.xls';
import { IAdminPermissions, IOutputOk, } from '../interfaces';
import { EmailType, SendEmailMqRequest, } from 'mq-plugin/protocols';

const createAdmin = async (r) => {
	try {
		const { email, password, username, } = r.payload;

		const adminExist = await Admin.findOne({
			where: {
				[Op.or]: {
					email,
					username,
				},
			},
		});
		if (adminExist) {
			const emailMessage: SendEmailMqRequest<EmailType.EmailExists> = {
				to: email,
				type: EmailType.EmailExists,
				fields: {},
			};
			r.server.mqSend('email', emailMessage);
			throw new Exception(Errors.EmailExists, ErrorsMessages[Errors.EmailExists], {});
		}

		const admin = await Admin.create(r.payload);

		const emailMessage: SendEmailMqRequest<EmailType.RegistrationCode> = {
			to: email,
			type: EmailType.RegistrationCode,
			fields: {
				code: password,
			},
		};
		r.server.mqSend('email', emailMessage);
		return output(admin);
	} catch (err) {
		return handlerError('Failed to create admin', err);
	}
};

const listAdmins: Lifecycle.Method = async (r) => {
	try {
		const { count, rows, } = await Admin.findAndCountAll({
			where: {
				...prepareQuery(r.query.query, [
					'firstName',
					'lastName',
					'middleName',
					'status',
					'roleKey'
				]),
			},
			include: [
				{
					model: AdminRole,
				}
			],
			distinct: true,
			...paginate(r),
			...order(r),
		});
		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list admins', err);
	}
};

const retrieveAdmin: Lifecycle.Method = async (r) => {
	try {
		const { id: adminId, } = r.params;
		const admin = await Admin.findOne({
			where: {
				id: adminId,
			},
			include: [
				{
					model: AdminRole,
					as: 'role',
				}
			],
		});
		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin not found', { adminId, });
		}

		return output(admin);
	} catch (err) {
		return handlerError('Failed to retrieve admin', err);
	}
};

export async function retriveSelfPermissions(
	r: Hapi.Request
): Promise<IOutputOk<IAdminPermissions> | Boom> {
	try {
		const { fullName, email, role, writePermissions, readPermissions, } = r.auth
			.credentials as unknown as IAdminPermissions;
		const permissions: IAdminPermissions = {
			fullName,
			email,
			role,
			writePermissions,
			readPermissions,
		};

		return output(permissions);
	} catch (err) {
		return handlerError('Failed to retrieve self permissions', err);
	}
}

const listAdminRoles: Lifecycle.Method = async () => {
	try {
		// This order of admin roles needed for frontend!
		const adminRoles = await AdminRole.findAll({
			order: [['serialNumber', 'asc']],
		});
		return output(adminRoles);
	} catch (err) {
		return handlerError('Failed to list admin roles', err);
	}
};

const updateAdminRole: Lifecycle.Method = async (r: Hapi.Request) => {
	try {
		const { key: adminKey, } = r.params;

		const adminRole = await AdminRole.findByPk(adminKey);

		if (!adminRole) {
			return handlerError('Admin role not found', { adminKey, });
		}

		const settings = r.payload as IAdminRole;

		const adminRoleUpdate = await adminRole.update({
			serialNumber: adminRole.serialNumber,
			...settings,
		});
		return output(adminRoleUpdate);
	} catch (err) {
		return handlerError('Failed to update admin role', err);
	}
};

const updateAdminFields: Lifecycle.Method = async (request: Hapi.Request) => {
	const { db: sequelize, } = request.server.app;
	const tx = await sequelize.transaction();
	try {
		const { firstName, lastName, middleName, username, email, phone, password, roleKey, } =
			request.payload as IUpdateAdminFields;
		const admin = await Admin.findByPk(request.params.id);

		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin not found', {});
		}

		await admin.update({
			transaction: tx,
			firstName,
			lastName,
			middleName,
			username,
			email,
			phone,
			password,
			roleKey,
		});

		await tx.commit();
		return output(admin);
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to update admin fields', err);
	}
};

const listAdminsLogs: Lifecycle.Method = async (request: Hapi.Request) => {
	try {
		const response = await queryAdminsLogs(request);
		return output(response);
	} catch (err) {
		return handlerError('Failed to list admins logs', err);
	}
};

const listAdminsLogsXslx: Lifecycle.Method = async (request: Hapi.Request, h) => {
	try {
		const response = await queryAdminsLogs(request);
		const name = 'Admins_logs.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnAdminsLogsTemplate(response), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to xlsx admins logs', err);
	}
};

export {
	listAdmins,
	retrieveAdmin,
	createAdmin,
	listAdminRoles,
	updateAdminRole,
	listAdminsLogs,
	updateAdminFields,
	listAdminsLogsXslx,
};
