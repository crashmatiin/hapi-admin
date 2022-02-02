import {
	BankOperation,
	BankRevise,
	User,
	UserProfile,
	UserProfileRole,
	UserProfileType,
	UserStatus,
	VerificationStatus,
} from 'invest-models';
import { IListQueries, } from '../../utils/utils.interfaces';

export interface IUsersNumericStats {
	total: number;
	active: number;
	verified: number;
	investors?: number;
	banned: number;
}

export interface IUserProfilesStats {
	stats: IUsersNumericStats;
	users: UserProfile[];
}

export interface IUsersStats {
	stats: IUsersNumericStats;
	users: User[];
}
export interface IBeneficiaryReportStats {
	rows: BankOperation[];
	count: number;
}

export interface IVirtualBalanceReportStats {
	rows: BankRevise[];
	count: number;
}
export interface IFields {
	active: number;
	verified: number;
	banned: number;
}
export interface ListUsersQueries extends IListQueries {
	status?: UserStatus.ACTIVE | UserStatus.BANNED | UserStatus.NEW;
	verification?:
		| VerificationStatus.UNVERIFIED
		| VerificationStatus.VERIFIED
		| VerificationStatus.FOR_VERIFICATION;
	role?: UserProfileRole.BORROWER | UserProfileRole.INVESTOR;
	type?: UserProfileType.INDIVIDUAL | UserProfileType.ENTITY | UserProfileType.ENTREPRENEUR;
	updateForm?: number;
	query?: string;
	from?: number;
	to?: number;
}

export interface UsersLog {
	tag: string;
	method: string;
	path: string;
	email: string;
	fullName: string;
	status?: UserStatus.ACTIVE | UserStatus.BANNED | UserStatus.NEW;
	id: string;
}
export interface IUsersLogs {
	rows: UsersLog[];
}
