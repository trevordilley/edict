import React from 'react';
import { buildGenericFormField } from '../../types/genericFormField';
import { ContainerPage } from '../ContainerPage/ContainerPage';
import { GenericForm } from '../GenericForm/GenericForm';
import { useErrors } from '../../rules/error/useErrors';

export function ArticleEditor({
  onSubmit,
}: {
  onSubmit: (ev: React.FormEvent) => void;
}) {
  const {
    Error: { errors },
  } = useErrors();
  return (
    <div className="editor-page">
      <ContainerPage>
        <div className="col-md-10 offset-md-1 col-xs-12">
          <GenericForm
            formObject={{ title: '', description: '', body: '', tag: '' }}
            disabled={false}
            errors={errors}
            onSubmit={onSubmit}
            submitButtonText="Publish Article"
            onAddItemToList={onAddTag}
            onRemoveListItem={onRemoveTag}
            fields={[
              buildGenericFormField({
                name: 'title',
                placeholder: 'Article Title',
              }),
              buildGenericFormField({
                name: 'description',
                placeholder: "What's this article about?",
                lg: false,
              }),
              buildGenericFormField({
                name: 'body',
                placeholder: 'Write your article (in markdown)',
                fieldType: 'textarea',
                rows: 8,
                lg: false,
              }),
              buildGenericFormField({
                name: 'tag',
                placeholder: 'Enter Tags',
                listName: 'tagList',
                fieldType: 'list',
                lg: false,
              }),
            ]}
          />
        </div>
      </ContainerPage>
    </div>
  );
}

function onAddTag() {
  // store.dispatch(addTag());
}

function onRemoveTag(_: string, index: number) {
  // store.dispatch(removeTag(index));
}
