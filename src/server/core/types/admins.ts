import { adminStatus, PermissionLevel, } from 'invest-models';

export interface IAdminRole {
	globalSettings: PermissionLevel;
	news: PermissionLevel;
	notificationsFromUsers: PermissionLevel;
	notificationsForUsers: PermissionLevel;
	accountsOperations: PermissionLevel;
	signaturesVerification: PermissionLevel;
	registryLookup: PermissionLevel;
	reports: PermissionLevel;
	users: PermissionLevel;
	documentsRegistry: PermissionLevel;
	borrowers: PermissionLevel;
	investors: PermissionLevel;
	support: PermissionLevel;
	permissionLevels: PermissionLevel;
	creditAgreements: PermissionLevel;
	legalOpinions: PermissionLevel;
	decisionsOnApplications: PermissionLevel;
	platformDocuments: PermissionLevel;
	faq: PermissionLevel;
	rosFinVerification: PermissionLevel;
	expressLoan: PermissionLevel;
	admins: PermissionLevel;
	loans: PermissionLevel;
}

export interface IUpdateAdminFields {
	firstName?: string;
	lastName?: string;
	middleName?: string;
	username?: string;
	email?: string;
	phone?: string;
	password?: string;
	roleKey?: string;
}
export interface AdminsLog {
	tag: string;
	method: string;
	path: string;
	email: string;
	firstName: string;
	lastName: string;
	middleName: string;
	status?: adminStatus.ACTIVE | adminStatus.BANNED | adminStatus.NEW;
	roleKey: string;
	id: string;
}
export interface IAdminsLogs {
	rows: AdminsLog[];
}
