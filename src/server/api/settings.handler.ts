import { Lifecycle, } from '@hapi/hapi';
import { Settings, } from 'invest-models';
import { output, } from '../utils';
import { handlerError, } from '../utils/error';

export const listSettings: Lifecycle.Method = async (r) => {
	const settings = await Settings.findAll({ raw: true, });
	return output({
		settings,
	});
};

export const updateSettings: Lifecycle.Method = async (r) => {
	const transaction = await r.server.app.db.transaction();
	try {
		const values = Object.entries(r.payload).map((item) => ({
			key: item[0],
			value: item[1],
		}));
		const updatedSettings = await Promise.all(
			values.map(async (entry) => {
				const tmp = await Settings.update(
					{
						value: entry.value,
					},
					{
						where: { key: entry.key, },
						returning: true,
						transaction,
					}
				);
				return tmp[1][0];
			})
		);
		await transaction.commit();
		return output({
			updatedSettings,
		});
	} catch (err) {
		await transaction.rollback();
		return handlerError('Failed to update settings', err);
	}
};
