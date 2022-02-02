import { Question, } from 'invest-models';
import { output, } from '../utils';
import { Exception, handlerError, } from '../utils/error';
import { Errors, } from '../utils/errors';
import { prepareQuery, } from '../utils/helpers';

export const createEntry = async (r) => {
	try {
		const question = await Question.findByPk(r.payload.slug, { raw: true, });
		if (question) {
			throw new Exception(Errors.Conflict, 'Slug must be unique', {});
		}

		const newQuestion = await Question.create(r.payload);
		return output({ question: newQuestion, });
	} catch (err) {
		return handlerError('Failed to create faq', err);
	}
};

export const retrieveEntry = async (r) => {
	try {
		const question = await Question.findByPk(r.payload.slug, { raw: true, });
		if (!question) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ question, });
	} catch (err) {
		return handlerError('Failed to retrieve faq', err);
	}
};

export const updateEntry = async (r) => {
	try {
		const question = await Question.update(r.payload, {
			where: { slug: r.params.slug, },
		});
		if (!question.length) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ question, });
	} catch (err) {
		return handlerError('Failed to update faq', err);
	}
};

export const deleteEntry = async (r) => {
	try {
		const question = await Question.destroy({
			where: { slug: r.params.slug, },
		});

		if (!question) {
			throw new Exception(Errors.NotFound, 'Entry not found', {});
		}

		return output({ question, });
	} catch (err) {
		return handlerError('Failed to delete faq', err);
	}
};

export const listEntries = async (r) => {
	try {
		const { limit, offset, query, order, } = r.query;
		const { count, rows, } = await Question.findAndCountAll({
			where: {
				...prepareQuery(query, ['slug', 'title', 'body']),
			},
			limit,
			offset,
			raw: true,
			distinct: true,
		});
		return output({
			count,
			questions: rows,
		});
	} catch (err) {
		return handlerError('Failed to list faq', err);
	}
};
