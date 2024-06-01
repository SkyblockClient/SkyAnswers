// @ts-check

import { petal } from '@flowr/eslint-config';

export default petal({
	ignores: ['old'],
	typescript: {
		overrides: {
			'ts/no-redeclare': 'off',
		},
	},
});
