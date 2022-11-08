import { FC, Fragment } from 'react';
import {
  FormGroup,
  ListFormGroup,
  TextAreaFormGroup,
} from '../FormGroup/FormGroup';
import { GenericFormField } from '../../types/genericFormField';
import { GenericErrors } from '../../types/error';
import { Errors } from '../Errors/Errors';

export interface GenericFormProps {
  fields: GenericFormField[];
  disabled: boolean;
  formObject: Record<string, string | null>;
  submitButtonText: string;
  errors: GenericErrors;
  onSubmit: (ev: React.FormEvent) => void;
  onAddItemToList?: (name: string) => void;
  onRemoveListItem?: (name: string, index: number) => void;
}
export const GenericForm: FC<GenericFormProps> = ({
  fields,
  disabled,
  formObject,
  submitButtonText,
  errors,
  onSubmit,
  onAddItemToList,
  onRemoveListItem,
}) => (
  <Fragment>
    <Errors errors={errors} />

    <form onSubmit={onSubmit}>
      <fieldset>
        {fields.map((field) =>
          field.fieldType === 'input' ? (
            <FormGroup
              key={field.name}
              name={field.name}
              disabled={disabled}
              type={field.type}
              placeholder={field.placeholder}
              lg={field.lg}
            />
          ) : field.fieldType === 'textarea' ? (
            <TextAreaFormGroup
              key={field.name}
              name={field.name}
              disabled={disabled}
              type={field.type}
              placeholder={field.placeholder}
              rows={field.rows as number}
              lg={field.lg}
            />
          ) : (
            <ListFormGroup
              name={field.name}
              key={field.name}
              disabled={disabled}
              type={field.type}
              placeholder={field.placeholder}
              listValue={
                formObject[field.listName as string] as unknown as string[]
              }
              onEnter={() =>
                onAddItemToList &&
                field.listName &&
                onAddItemToList(field.listName)
              }
              onRemoveItem={(index) =>
                onRemoveListItem &&
                field.listName &&
                onRemoveListItem(field.listName, index)
              }
              lg={field.lg}
            />
          )
        )}
        <button className="btn btn-lg btn-primary pull-xs-right">
          {submitButtonText}
        </button>
      </fieldset>
    </form>
  </Fragment>
);
