import { News, } from 'invest-models';
import { output, } from '../utils';
import { Exception, handlerError, } from '../utils/error';
import { Errors, } from '../utils/errors';

export const createEntry = async (r) => {
	try {
		const news = await News.findByPk(r.params.slug);
		if (news) {
			throw new Exception(Errors.Conflict, 'Slug must be unique', {});
		}

		const newEntry = await News.create(r.paylod);
		return output({ news: newEntry, });
	} catch (err) {
		return handlerError('Failed to create news', err);
	}
};

export const retrieveEntry = async (r) => {
	try {
		const news = await News.findByPk(r.params.slug);
		if (!news) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ news, });
	} catch (err) {
		return handlerError('Failed to retrieve news', err);
	}
};

export const updateEntry = async (r) => {
	try {
		const affectedRows = await News.update(r.payload, {
			where: { slug: r.params.slug, },
			returning: true,
		});
		const news = affectedRows[1];
		if (!news.length) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ news, });
	} catch (err) {
		return handlerError('Failed to update news', err);
	}
};

export const deleteEntry = async (r) => {
	try {
		const affectedRows = await News.destroy({ where: { slug: r.params.slug, }, });

		if (!affectedRows) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ affectedRows, });
	} catch (err) {
		return handlerError('Failed to delete news', err);
	}
};

export const listEntries = async (r) => {
	try {
		const news = await News.findAll({ raw: true, });
		return output({
			news,
		});
	} catch (err) {
		return handlerError('Failed to list news', err);
	}
};
