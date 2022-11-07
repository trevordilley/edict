import React, { FormEvent } from 'react';
import { login } from '../../../services/conduit';
import { dispatchOnCall, store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import {
  initializeLogin,
  LoginState,
  startLoginIn,
  updateField,
} from './Login.slice';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { insert, retract } from '../../../rules/session';
import { FetchState } from '../../../rules/schema';

export function Login() {
  const { loginIn, user } = useStoreWithInitializer(
    ({ login }) => login,
    dispatchOnCall(initializeLogin())
  );
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
            disabled={loginIn}
            formObject={user}
            submitButtonText="Sign in"
            errors={errors}
            onChange={onUpdateField}
            onSubmit={(ev) =>
              signIn(
                ev as unknown as FormEvent<{ email: string; password: string }>
              )
            }
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

function onUpdateField(name: string, value: string) {
  store.dispatch(
    updateField({ name: name as keyof LoginState['user'], value })
  );
}

async function signIn(
  ev: React.FormEvent<{ email: string; password: string }>
) {
  ev.preventDefault();
  const { email, password } = ev.currentTarget;
  if (store.getState().login.loginIn) return;
  store.dispatch(startLoginIn());
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
