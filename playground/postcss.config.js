import tailwind from '@tailwindcss/postcss';
import scope from '../scripts/postcss-scope.mjs';

export default {
    plugins: [tailwind(), scope()],
};
