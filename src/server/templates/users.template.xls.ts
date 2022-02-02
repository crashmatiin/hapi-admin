import { IUsersStats, } from '../core/types/users';

export function returnUserTemplate(data: IUsersStats) {
	return [
		[
			`Общее число пользователей: ${data.stats.total}`,
			`Общее число активных пользователей: ${data.stats.active}`,
			`Общее число заблокированных пользователей: ${data.stats.banned}`
		],
		['Фамилия', 'Имя', 'Отчество', 'Email', 'День рождения', 'Пол', 'Статус', 'Статус верификации'],
		...data.users.map((item) => [
			item.lastName,
			item.firstName,
			item.middleName,
			item.email,
			item.birthday,
			item.gender,
			item.status,
			item.verificationStatus
		])
	];
}
