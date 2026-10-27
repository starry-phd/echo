import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', '.expo/**', '.wrangler/**'] },
  ...tseslint.configs.recommended,
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
);
