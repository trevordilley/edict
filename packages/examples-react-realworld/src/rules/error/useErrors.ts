import { errorRule } from './error';
import { useRuleOne } from '../useRule';

export const useErrors = () => useRuleOne(errorRule)?.App.errors ?? {};
