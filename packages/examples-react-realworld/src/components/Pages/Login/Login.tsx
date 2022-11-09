import React, { FormEvent, useEffect, useState } from 'react';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { loginRule, startLogin } from '../../../rules/user/user';

const useLogin = () => {
  const [login, setLogin] = useState(loginRule.queryOne());
  useEffect(() => loginRule.subscribeOne((l) => setLogin(l)));
  const errors = useErrors();
  return {
    login: login?.Login,
    errors: errors.Error.errors,
  };
};

export function Login() {
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
              signIn(ev);
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

async function signIn(ev: FormEvent) {
  ev.preventDefault();
  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    email: { value: string };
    password: { value: string };
  };
  const email = formValues.email.value;
  const password = formValues.password.value;
  startLogin(email, password);
}
