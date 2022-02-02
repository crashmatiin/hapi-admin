import { IAdminsLogs, } from '../core/types/admins';

export function returnAdminsLogsTemplate(data: IAdminsLogs): Array<Array<string | number>> {
	return [
		['Тэг', 'Метод', 'Путь', 'Email', 'ФИО', 'Статус', 'Роль', 'id'],
		...data.rows.map((item) => [
			item.tag,
			item.method,
			item.path,
			item.email,
			`${item.lastName} ${item.firstName} ${item.middleName}`,
			item.status,
			item.roleKey,
			item.id
		])
	];
}
