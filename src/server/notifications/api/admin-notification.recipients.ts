import { Admin, AdminRole, PermissionLevel, } from 'invest-models';
import { Op, } from 'sequelize';
import { Server, } from '@hapi/hapi';

export async function queryRecipients(server: Server): Promise<string[]> {
	const sequelize = server.app.db;
	const roles = await AdminRole.findAll({
		where: {
			notificationsFromUsers: {
				[Op.in]: [PermissionLevel.READ, PermissionLevel.WRITE],
			},
		},
	});
	const keys = roles.map((role) => role.key);
	const admins = await Admin.findAll({
		where: {
			roleKey: {
				[Op.in]: keys,
			},
		},
	});
	return admins.map((admin) => admin.id);
}
