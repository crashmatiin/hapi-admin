import { Lifecycle, } from '@hapi/hapi';
import {
	VirtualBalanceMoneyboxRequest,
	VirtualBalanceMoneyboxResponse,
	VirtualBalanceMqRequest,
} from 'mq-plugin/protocols';
import { output, } from '../utils';

export const moneyboxVirtualBalance: Lifecycle.Method = async (request) =>
	output(
		await request.server.mqCall<VirtualBalanceMqRequest, VirtualBalanceMoneyboxResponse>(
			'moneybox:raw-request',
			{
				operation: 'virtual_balance',
				request: request.payload as VirtualBalanceMoneyboxRequest,
			}
		)
	);
