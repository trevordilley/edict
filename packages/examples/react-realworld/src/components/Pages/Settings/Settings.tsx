import React from 'react';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../organisms/GenericForm/GenericForm';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { useRuleOne } from '../../../rules/useRule';
import { useEdict } from '../../../rules/EdictContext';
import { EdictSession } from '../../../rules/session';

const useSettings = () => {
  const { USER, ERROR } = useEdict();
  const settingsBeingUpdated = useRuleOne(
    USER.RULES.updateSettingsRule
  )?.UpdateSettings;
  const errors = ERROR.HOOKS.useErrors();
  const user = USER.HOOKS.useUser();
  return {
    errors,
    user,
    updatingSettings: !!settingsBeingUpdated,
  };
};

export function Settings() {
  const EDICT = useEdict();
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
            onSubmit={(ev) => onSubmit(ev, EDICT)}
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
            onClick={() => logout(EDICT, user?.username)}
          >
            Or click here to logout.
          </button>
        </div>
      </ContainerPage>
    </div>
  );
}

function onSubmit(ev: React.FormEvent, EDICT: EdictSession) {
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
  const username = EDICT.SESSION.RULES.sessionRule.queryOne()?.Session.username;
  if (!username) {
    throw new Error(
      "Why is the session username undefined? This shouldn't happen when logged in!"
    );
  }
  EDICT.USER.ACTIONS.updateProfileSettings({
    username: formValues.username.value,
    password: formValues.password.value,
    image: formValues.image.value,
    bio: formValues.bio.value,
    email: formValues.email.value,
  });
}

function logout(EDICT: EdictSession, username?: string) {
  if (!username) throw new Error('Logging out undefined username?');
  EDICT.USER.ACTIONS.setToken(undefined);
}
