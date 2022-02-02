import { IUserProfilesStats, } from '../core/types/users';

export function returnTemplate(data: IUserProfilesStats) {
	return [
		[
			`Общее число пользователей: ${data.stats.total}`,
			`Общее число инвесторов: ${data.stats.investors}`,
			`Общее число активных пользователей: ${data.stats.active}`,
			`Общее число заблокированных пользователей: ${data.stats.banned}`,
			`Общее число верифицированных пользователей: ${data.stats.verified}`
		],
		[
			'Фамилия',
			'Имя',
			'Отчество',
			'Телефон',
			'Email',
			'День рождения',
			'Роль',
			'Тип',
			'Статус квалификации',
			'Статус',
			'Статус верификации'
		],
		...data.users.map((item) => [
			item.user.lastName,
			item.user.firstName,
			item.user.middleName,
			item.phone,
			item.email,
			item.user.birthday,
			item.role,
			item.type,
			item.qualificationStatus,
			item.status,
			item.user.verificationStatus
		])
	];
}
