import React, { FormEvent } from 'react';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../organisms/GenericForm/GenericForm';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { useRuleOne } from '../../../rules/useRule';
import { useEdict } from '../../../rules/EdictContext';

const useLogin = () => {
  const { USER, ERROR } = useEdict();
  const login = useRuleOne(USER.RULES.loginRule);
  const errors = ERROR.HOOKS.useErrors();
  return {
    login: login?.Login,
    errors,
  };
};

export function Login() {
  const { USER } = useEdict();
  const { login, errors } = useLogin();
  return (
    <div className="auth-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Sign in</h1>
          <p className="text-xs-center">
            <a href="/#/register">Need an account?</a>
          </p>

          <GenericForm
            disabled={!!login}
            formObject={{ email: '', password: '' }}
            submitButtonText="Sign in"
            errors={errors}
            onSubmit={(ev) => {
              signIn(ev, USER.ACTIONS.startLogin);
            }}
            fields={[
              buildGenericFormField({
                name: 'email',
                placeholder: 'Email',
                type: 'email',
              }),
              buildGenericFormField({
                name: 'password',
                placeholder: 'Password',
                type: 'password',
              }),
            ]}
          />
        </div>
      </ContainerPage>
    </div>
  );
}

async function signIn(
  ev: FormEvent,
  login: (email: string, password: string) => void
) {
  ev.preventDefault();
  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    email: { value: string };
    password: { value: string };
  };
  const email = formValues.email.value;
  const password = formValues.password.value;
  login(email, password);
}
