import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../organisms/GenericForm/GenericForm';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { FormEvent } from 'react';
import { useEdict } from '../../../rules/EdictContext';
import { useRuleOne } from '../../../rules/useRule';

const useRegistration = () => {
  const { USER, ERROR } = useEdict();

  const registration = useRuleOne(USER.RULES.startRegistrationRule);

  const errors = ERROR.HOOKS.useErrors();
  return {
    registration,
    errors,
    startRegistration: USER.ACTIONS.startRegistration,
  };
};

export function Register() {
  const { registration, errors, startRegistration } = useRegistration();

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
            onSubmit={(ev) => onSubmit(ev, startRegistration)}
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

function onSubmit(
  ev: FormEvent,
  startRegistration: (args: {
    username: string;
    password: string;
    email: string;
  }) => void
) {
  ev.preventDefault();
  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    username: { value: string };
    password: { value: string };
    email: { value: string };
  };
  startRegistration({
    username: formValues.username.value,
    password: formValues.password.value,
    email: formValues.email.value,
  });
}
