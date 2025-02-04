import React from 'react';

import { useAppSelector, useHasChangedIgnoreUndefined } from 'src/common/hooks';
import { useGetOptions } from 'src/components/hooks';
import { useDelayedSavedState } from 'src/components/hooks/useDelayedSavedState';
import { getOptionLookupKey } from 'src/utils/options';
import type { IComponentProps } from 'src/components';
import type { ILayoutCompDropdown } from 'src/features/form/layout';

import { AltinnSpinner, Select } from 'altinn-shared/components';

export type IDropdownProps = IComponentProps &
  Omit<ILayoutCompDropdown, 'type'>;

function DropdownComponent({
  optionsId,
  formData,
  preselectedOptionIndex,
  handleDataChange,
  id,
  readOnly,
  isValid,
  getTextResourceAsString,
  mapping,
  source,
}: IDropdownProps) {
  const options = useGetOptions({ optionsId, mapping, source });
  const fetchingOptions = useAppSelector(
    (state) =>
      state.optionState.options[getOptionLookupKey({ id: optionsId, mapping })]
        ?.loading,
  );
  const hasSelectedInitial = React.useRef(false);
  const optionsHasChanged = useHasChangedIgnoreUndefined(options);

  const { value, setValue, saveValue } = useDelayedSavedState(
    handleDataChange,
    formData?.simpleBinding,
    200,
  );

  React.useEffect(() => {
    const shouldSelectOptionAutomatically =
      !formData?.simpleBinding &&
      options &&
      preselectedOptionIndex >= 0 &&
      preselectedOptionIndex < options.length &&
      hasSelectedInitial.current === false;

    if (shouldSelectOptionAutomatically) {
      setValue(options[preselectedOptionIndex].value, true);
      hasSelectedInitial.current = true;
    }
  }, [options, formData, preselectedOptionIndex, setValue]);

  React.useEffect(() => {
    if (optionsHasChanged && formData.simpleBinding) {
      // New options have been loaded, we have to reset form data.
      // We also skip any required validations
      setValue(undefined, true);
    }
  }, [optionsHasChanged, formData, setValue]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(event.target.value);
  };

  return (
    <>
      {fetchingOptions ? (
        <AltinnSpinner />
      ) : (
        <Select
          id={id}
          onChange={handleChange}
          onBlur={saveValue}
          value={value}
          disabled={readOnly}
          error={!isValid}
          options={
            options?.map((option) => ({
              label: getTextResourceAsString(option.label),
              value: option.value,
            })) || []
          }
        />
      )}
    </>
  );
}

export default DropdownComponent;
