import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-prettier'

export default [
...pluginVue.configs['flat/recommended'],
...vueTsEslintConfig(),
]