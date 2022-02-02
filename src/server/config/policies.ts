import { PermissionLevel, } from 'invest-models';

export function buildPolicy(key: string, min: PermissionLevel = PermissionLevel.READ) {
	let policiesList;
	if (min === PermissionLevel.WRITE) {
		policiesList = 'credentials:writePermissions';
	} else if (min === PermissionLevel.READ) {
		policiesList = 'credentials:readPermissions';
	}

	const rule = {
		effect: 'permit',
	};
	const target = {};
	target[policiesList] = key;
	rule['target'] = target;
	return {
		apply: 'permit-overrides',
		rules: [
			rule,
			{
				effect: 'deny',
			}
		],
	};
}
