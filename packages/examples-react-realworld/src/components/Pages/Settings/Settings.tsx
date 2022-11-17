import React from 'react';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../organisms/GenericForm/GenericForm';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { useUser } from '../../../rules/user/useUser';
import { setToken, updateSettingsRule } from '../../../rules/user/user';
import { insert } from '../../../rules/session';
import { sessionRule } from '../../../rules/session/session';
import { FetchState } from '../../../rules/schema';
import { useRuleOne } from '../../../rules/useRule';

const useSettings = () => {
  const updatingSettings =
    useRuleOne(updateSettingsRule)?.SettingsPage.fetchState === FetchState.SENT;
  const errors = useErrors();
  const user = useUser();
  return { errors, user, updatingSettings };
};

export function Settings() {
  const { errors, user, updatingSettings } = useSettings();
  return (
    <div className="settings-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Your Settings</h1>
          <GenericForm
            disabled={updatingSettings}
            formObject={{ ...user }}
            submitButtonText="Update Settings"
            errors={errors}
            onSubmit={onSubmit}
            fields={[
              buildGenericFormField({
                name: 'image',
                placeholder: 'URL of profile picture',
              }),
              buildGenericFormField({
                name: 'username',
                placeholder: 'Your Name',
              }),
              buildGenericFormField({
                name: 'bio',
                placeholder: 'Short bio about you',
                rows: 8,
                fieldType: 'textarea',
              }),
              buildGenericFormField({ name: 'email', placeholder: 'Email' }),
              buildGenericFormField({
                name: 'password',
                placeholder: 'Password',
                type: 'password',
              }),
            ]}
          />

          <hr />
          <button
            className="btn btn-outline-danger"
            onClick={() => logout(user?.username)}
          >
            Or click here to logout.
          </button>
        </div>
      </ContainerPage>
    </div>
  );
}

function onSubmit(ev: React.FormEvent) {
  ev.preventDefault();
  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    username: { value: string };
    password: { value: string };
    image: { value: string };
    bio: { value: string };
    email: { value: string };
  };
  const username = sessionRule.queryOne()?.Session.username;
  if (!username) {
    throw new Error(
      "Why is the session username undefined? This shouldn't happen when logged in!"
    );
  }
  insert({
    [username]: {
      username: formValues.username.value,
      password: formValues.password.value,
      image: formValues.image.value,
      bio: formValues.bio.value,
      email: formValues.email.value,
    },
    SettingsPage: {
      fetchState: FetchState.QUEUED,
    },
  });
}

function logout(username?: string) {
  if (!username) throw new Error('Logging out undefined username?');
  setToken(undefined);
}
