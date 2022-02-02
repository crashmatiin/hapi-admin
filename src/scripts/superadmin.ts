import { initDatabase, } from 'invest-models/lib/handler';
import { loadDatabaseConfig, } from 'invest-models/lib/config';
import { Admin, AdminRole, } from 'invest-models';
import prompt = require('prompt');
import { handlerError, } from '../server/utils/error';

const properties = [
	{
		name: 'firstName',
		validator: /^[a-zA-Z\s-]+$/,
		warning: 'Username must be only letters, spaces, or dashes',
	},
	{
		name: 'middleName',
		validator: /^[a-zA-Z\s-]+$/,
		warning: 'Username must be only letters, spaces, or dashes',
	},
	{
		name: 'lastName',
		validator: /^[a-zA-Z\s-]+$/,
		warning: 'Username must be only letters, spaces, or dashes',
	},
	{
		name: 'email',
		validator: /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/,
		warning: 'Must be valid email address',
	},
	{
		name: 'password',
		hidden: true,
	}
];
prompt.start();

async function createSuperAdmin(creds: prompt.Properties): Promise<number> {
	try {
		initDatabase(loadDatabaseConfig());
		const role = await AdminRole.findByPk('superadmin');
		if (!role) {
			throw new Error('No superadmin role was created');
		}

		await Admin.create({
			...creds,
			role,
			roleKey: role.key,
		});
		return 0;
	} catch (err) {
		return errorHandler(err);
	}
}

function errorHandler(err: Error) {
	console.log(err);
	return 1;
}

prompt.get(properties, (err, result) => {
	if (err) {
		return errorHandler(err);
	}

	return createSuperAdmin(result);
});
