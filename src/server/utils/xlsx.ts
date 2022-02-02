import xlsx from 'node-xlsx';
import { Readable, } from 'stream';

export class SpreadsheetFormatter {
	rawData: any;

	buffer: ArrayBuffer;

	data: string[];

	constructor() {}

	async format(data, meta) {
		this.rawData = data;
		this.buffer = await xlsx.build([
			{
				name: meta.name,
				data,
			}
		]);
		return this._bufferToStream();
	}

	protected _bufferToStream(): Readable {
		const stream = new Readable();
		stream.push(this.buffer);
		stream.push(null);
		return stream;
	}
}
