import React from 'react';

export function FormGroup({
  name,
  type,
  placeholder,
  disabled,
  lg,
}: {
  name: string;
  type: string;
  placeholder: string;
  disabled: boolean;
  lg: boolean;
}) {
  return (
    <fieldset className="form-group">
      <input
        name={name}
        className={`form-control${!lg ? '' : ' form-control-lg'}`}
        {...{
          type,
          placeholder,
          disabled,
        }}
      />
    </fieldset>
  );
}

export function TextAreaFormGroup({
  name,
  type,
  placeholder,
  disabled,
  rows,
  lg,
}: {
  name: string;
  type: string;
  placeholder: string;
  disabled: boolean;
  rows: number;
  lg: boolean;
}) {
  return (
    <fieldset className="form-group">
      <textarea
        name={name}
        className={`form-control${!lg ? '' : ' form-control-lg'}`}
        {...{
          type,
          placeholder,
          disabled,
          rows,
        }}
      ></textarea>
    </fieldset>
  );
}

export function ListFormGroup({
  name,
  type,
  placeholder,
  disabled,
  listValue,
  lg,
  onEnter,
  onRemoveItem,
}: {
  name: string;
  type: string;
  placeholder: string;
  disabled: boolean;
  listValue: string[];
  lg: boolean;
  onEnter: () => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <fieldset className="form-group">
      <input
        name={name}
        className={`form-control${!lg ? '' : ' form-control-lg'}`}
        {...{
          type,
          placeholder,
          disabled,
        }}
        onKeyDown={(ev) => ev.key === 'Enter' && ev.preventDefault()}
        onKeyUp={onListFieldKeyUp(onEnter)}
      />
      <div className="tag-list">
        {listValue.map((value, index) => (
          <span
            key={value}
            className="tag-default tag-pill"
            onClick={() => onRemoveItem(index)}
          >
            <i className="ion-close-round"></i>
            {value}
          </span>
        ))}
      </div>
    </fieldset>
  );
}

export function onListFieldKeyUp(
  onEnter: () => void
): (ev: React.KeyboardEvent) => void {
  return (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      onEnter();
    }
  };
}
