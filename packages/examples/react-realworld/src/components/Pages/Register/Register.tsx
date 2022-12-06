import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../organisms/GenericForm/GenericForm';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { FormEvent, useEffect, useState } from 'react';
import { insert } from '../../../rules/session';
import { startRegistrationRule } from '../../../rules/user/user';

const useRegistration = () => {
  const [registration, setRegistration] = useState(
    startRegistrationRule.queryOne()
  );
  useEffect(() =>
    startRegistrationRule.subscribeOne((r) => setRegistration(r))
  );
  const errors = useErrors();
  return { registration, errors };
};

export function Register() {
  const { registration, errors } = useRegistration();

  return (
    <div className="auth-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Sign up</h1>
          <p className="text-xs-center">
            <a href="/#/login">Have an account?</a>
          </p>

          <GenericForm
            disabled={!!registration}
            formObject={{ username: '', password: '', email: '' }}
            submitButtonText="Sign up"
            errors={errors}
            onSubmit={onSubmit}
            fields={[
              buildGenericFormField({
                name: 'username',
                placeholder: 'Username',
              }),
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

function onSubmit(ev: FormEvent) {
  ev.preventDefault();
  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    username: { value: string };
    password: { value: string };
    email: { value: string };
  };

  insert({
    StartRegistration: {
      username: formValues.username.value,
      email: formValues.email.value,
      password: formValues.password.value,
    },
  });
}
