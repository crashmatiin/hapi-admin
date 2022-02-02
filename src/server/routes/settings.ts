import { ServerRoute, } from '@hapi/hapi';
import { globalSettingsSchema, } from '../schemas';
import api from '../api';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/settings',
		handler: api.settings.listSettings,
		options: {
			tags: ['api', 'settings'],
		},
	},
	{
		method: 'PUT',
		path: '/settings',
		handler: api.settings.updateSettings,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2428,
			},
			tags: ['api', 'settings'],
			validate: {
				payload: globalSettingsSchema,
			},
		},
	}
];
export default routes;
