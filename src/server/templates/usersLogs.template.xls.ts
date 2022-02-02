import { IUsersLogs, } from '../core/types/users';

export function returnUsersLogsTemplate(data: IUsersLogs): Array<Array<string | number>> {
	return [
		['Тэг', 'Метод', 'Путь', 'Email', 'ФИО', 'Статус', 'id'],
		...data.rows.map((item) => [
			item.tag,
			item.method,
			item.path,
			item.email,
			item.fullName,
			item.status,
			item.id
		])
	];
}
