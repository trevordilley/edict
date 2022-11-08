import React, { useEffect, useState } from 'react';
import { buildGenericFormField } from '../../../types/genericFormField';
import { GenericForm } from '../../GenericForm/GenericForm';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { useUser } from '../../../rules/user/useUser';
import { updateSettingsRule } from '../../../rules/user/user';
import { insert } from '../../../rules/session';

const useSettings = () => {
  const [updatedSettings, setUpdatedSettings] = useState(
    updateSettingsRule.queryOne()
  );
  useEffect(() =>
    updateSettingsRule.subscribeOne((r) => setUpdatedSettings(r))
  );

  const {
    Error: { errors },
  } = useErrors();
  const user = useUser();
  return { updatedSettings: updatedSettings?.UpdateSettings, errors, user };
};

export function Settings() {
  const { updatedSettings, errors, user } = useSettings();
  return (
    <div className="settings-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Your Settings</h1>

          <GenericForm
            disabled={!!updatedSettings}
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

  console.log('submitting?');
  insert({
    UpdateSettings: {
      username: formValues.username.value,
      password: formValues.password.value,
      image: formValues.image.value,
      bio: formValues.bio.value,
      email: formValues.email.value,
    },
  });
}

function logout(username?: string) {
  if (!username) throw new Error('Logging out undefined username?');
  insert({
    LogoutUser: {
      username,
    },
  });
}
