import React, { FormEvent } from 'react';
import { login } from '../../../services/conduit';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { insert, retract } from '../../../rules/session';
import { FetchState } from '../../../rules/schema';

export function Login() {
  const {
    Error: { errors },
  } = useErrors();
  return (
    <div className="auth-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Sign in</h1>
          <p className="text-xs-center">
            <a href="/#/register">Need an account?</a>
          </p>

          <GenericForm
            disabled={false}
            formObject={{ email: '', password: '' }}
            submitButtonText="Sign in"
            errors={errors}
            onSubmit={(ev) => {
              signIn(ev);
            }}
            fields={[
              buildGenericFormField({ name: 'email', placeholder: 'Email' }),
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

  insert({
    User: {
      isLoggingIn: FetchState.QUEUED,
    },
  });
  login(email, password).then((result) => {
    retract('User', 'isLoggingIn');
    result.match({
      ok: (user) => {
        insert({
          User: user,
        });
        window.location.hash = '#/';
      },
      err: (e) => {
        insert({
          Errors: e,
        });
      },
    });
  });
}
