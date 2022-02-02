import {
	UserProfileStatus,
	VerificationStatus,
	UserProfileRole,
	UserProfileType,
} from 'invest-models';
import { IListQueries, } from '../../utils/utils.interfaces';

export interface ListUsersNotificationsQueries extends IListQueries {
	from?: number;
	to?: number;
	verificationStatus?: string;
	status?: string;
	type?: string;
}

export interface UsersGroupsPayload {
	status?: UserProfileStatus[];
	VerificationStatus?: VerificationStatus[];
	UserProfileRole?: UserProfileRole[];
	UserProfileType?: UserProfileType[];
}
export interface CreateUsersNotificationPayload {
	message: string;
	recipients?: string[];
	groups: UsersGroupsPayload;
	files?: [
		{
			id: string;
			name: string;
		},
	];
	broadcast: boolean;
}
