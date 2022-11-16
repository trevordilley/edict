import { useRuleOne } from '../useRule';
import { sessionRule } from './session';

const useSession = () => useRuleOne(sessionRule)?.Session.token;
