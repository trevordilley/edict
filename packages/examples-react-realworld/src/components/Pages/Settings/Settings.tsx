import axios from 'axios';
import React from 'react';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { UserSettings } from '../../../types/user';
import { buildGenericFormField } from '../../../types/genericFormField';
import { logout } from '../../App/App.slice';
import { GenericForm } from '../../GenericForm/GenericForm';
import { startUpdate } from './Settings.slice';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useErrors } from '../../../rules/error/useErrors';
import { useUser } from '../../../rules/user/useUser';

export interface SettingsField {
  name: keyof UserSettings;
  type?: string;
  isTextArea?: true;
  placeholder: string;
}

export function Settings() {
  const { updating } = useStore(({ settings }) => settings);
  const user = useUser();
  const {
    Error: { errors },
  } = useErrors();
  return (
    <div className="settings-page">
      <ContainerPage>
        <div className="col-md-6 offset-md-3 col-xs-12">
          <h1 className="text-xs-center">Your Settings</h1>

          <GenericForm
            disabled={updating}
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
          <button className="btn btn-outline-danger" onClick={_logout}>
            Or click here to logout.
          </button>
        </div>
      </ContainerPage>
    </div>
  );
}

function onSubmit(ev: React.FormEvent) {
  ev.preventDefault();
  store.dispatch(startUpdate());

  const target = ev.currentTarget;
  // Todo: Clean this up.
  const formValues = target as typeof target & {
    username: { value: string };
    password: { value: string };
    image: { value: string };
    bio: { value: string };
  };

  console.log(
    formValues.username.value,
    formValues.bio.value,
    formValues.password.value,
    formValues.image.value
  );

  // result.match({
  //   err: (e) => store.dispatch(updateErrors(e)),
  //   ok: (user) => {
  //     store.dispatch(loadUser(user));
  //     window.location.hash = '/';
  //   },
  // });
}

function _logout() {
  delete axios.defaults.headers.Authorization;
  localStorage.removeItem('token');
  store.dispatch(logout());
  window.location.hash = '/';
}
