import { render, screen } from '@testing-library/react';
import { ListFormGroup } from './FormGroup';

it('Input should be large', () => {
  const onEnter = jest.fn();
  const onRemoveItem = jest.fn();
  render(
    <ListFormGroup
      type="text"
      placeholder="1234"
      onEnter={onEnter}
      lg
      listValue={[]}
      disabled
      onRemoveItem={onRemoveItem}
      name={'list'}
    />
  );

  expect(screen.getByPlaceholderText('1234').className.split(' ')).toContain(
    'form-control-lg'
  );
});
