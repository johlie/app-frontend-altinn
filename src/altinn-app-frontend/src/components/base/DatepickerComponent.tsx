import * as React from 'react';

import MomentUtils from '@date-io/moment';
import {
  Grid,
  Icon,
  makeStyles,
  useMediaQuery,
  useTheme,
} from '@material-ui/core';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import moment from 'moment';

import { getFlagBasedDate, getISOString } from 'src/utils/dateHelpers';
import { renderValidationMessagesForComponent } from 'src/utils/render';
import {
  DatePickerFormatDefault,
  DatePickerMaxDateDefault,
  DatePickerMinDateDefault,
  DatePickerSaveFormatNoTimestamp,
  validateDatepickerFormData,
} from 'src/utils/validation';
import type { IComponentProps } from 'src/components';
import type { ILayoutCompDatePicker } from 'src/features/form/layout';
import type { DateFlags, IComponentBindingValidation } from 'src/types';

import { getLanguageFromKey } from 'altinn-shared/utils';

import 'src/components/base/DatepickerComponent.css';
import 'src/styles/shared.css';

export type IDatePickerProps = IComponentProps &
  Omit<ILayoutCompDatePicker, 'type'>;

const iconSize = '30px';

const useStyles = makeStyles((theme) => ({
  root: {
    boxSizing: 'border-box',
    height: '36px',
    fontSize: '1.6rem',
    borderWidth: '2px',
    borderStyle: 'solid',
    marginBottom: '0px',
    borderColor: theme.altinnPalette.primary.blueMedium,
    '&:hover': {
      borderColor: theme.altinnPalette.primary.blueDark,
    },
    '&:focus-within': {
      outlineOffset: '0px',
      outline: `2px solid ${theme.altinnPalette.primary.blueDark}`,
    },
  },
  input: {
    padding: '0px',
    marginLeft: '12px',
  },
  invalid: {
    borderColor: `${theme.altinnPalette.primary.red} !important`,
    outlineColor: `${theme.altinnPalette.primary.red} !important`,
  },
  icon: {
    fontSize: iconSize,
    lineHeight: iconSize,
  },
  formHelperText: {
    fontSize: '1.4rem',
  },
  datepicker: {
    width: 'auto',
    marginBottom: '0px',
    marginTop: '0px',
  },
}));

class AltinnMomentUtils extends MomentUtils {
  getDatePickerHeaderText(date: moment.Moment) {
    if (date && date.locale() === 'nb') {
      return date.format('ddd, D MMM');
    }
    return super.getDatePickerHeaderText(date);
  }
}

// We dont use the built-in validation for the 3rd party component, so it is always empty string
const emptyString = '';

function DatepickerComponent({
  minDate,
  maxDate,
  format,
  language,
  componentValidations,
  formData,
  timeStamp = true,
  handleDataChange,
  readOnly,
  required,
  id,
  isValid,
  textResourceBindings,
}: IDatePickerProps) {
  const classes = useStyles();
  const [date, setDate] = React.useState<moment.Moment>(null);
  const [validDate, setValidDate] = React.useState<boolean>(true);
  const [validationMessages, setValidationMessages] =
    React.useState<IComponentBindingValidation>(null);
  const locale =
    window.navigator?.language ||
    (window.navigator as any)?.userLanguage ||
    'nb';
  moment.locale(locale);

  const calculatedMinDate =
    getFlagBasedDate(minDate as DateFlags) ||
    getISOString(minDate) ||
    DatePickerMinDateDefault;
  const calculatedMaxDate =
    getFlagBasedDate(maxDate as DateFlags) ||
    getISOString(maxDate) ||
    DatePickerMaxDateDefault;

  const calculatedFormat =
    moment.localeData().longDateFormat('L') ||
    format ||
    DatePickerFormatDefault;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isDateEmpty = React.useCallback(() => {
    return date && date.parsingFlags().parsedDateParts.length === 0;
  }, [date]);

  const getValidationMessages = React.useCallback(() => {
    let checkDate: string;
    if (!date || isDateEmpty()) {
      checkDate = '';
    } else if (date.isValid()) {
      checkDate = date.toISOString();
    } else {
      checkDate = null;
    }
    const validations: IComponentBindingValidation = validateDatepickerFormData(
      checkDate,
      calculatedMinDate,
      calculatedMaxDate,
      calculatedFormat,
      language,
    );
    const suppliedValidations = componentValidations?.simpleBinding;
    if (suppliedValidations?.errors) {
      suppliedValidations.errors.forEach((validation: string) => {
        if (validations.errors.indexOf(validation) === -1) {
          validations.errors.push(validation);
        }
      });
    }
    if (suppliedValidations?.warnings) {
      suppliedValidations.warnings.forEach((validation: string) => {
        if (validations.warnings.indexOf(validation) === -1) {
          validations.warnings.push(validation);
        }
      });
    }
    return validations;
  }, [
    calculatedFormat,
    calculatedMinDate,
    calculatedMaxDate,
    language,
    componentValidations,
    date,
    isDateEmpty,
  ]);

  React.useEffect(() => {
    const dateValue = formData?.simpleBinding
      ? moment(formData.simpleBinding)
      : null;
    setDate(dateValue);
  }, [formData?.simpleBinding]);

  React.useEffect(() => {
    setValidationMessages(getValidationMessages());
  }, [getValidationMessages]);

  const handleDateChange = (dateValue: moment.Moment) => {
    dateValue
      ?.set('hour', 12)
      ?.set('minute', 0)
      ?.set('second', 0)
      ?.set('millisecond', 0);
    setValidDate(true); // we reset valid date => show error onBlur or when user is done typing
    setValidationMessages({});
    if (dateValue && dateValue.isValid()) {
      setDate(dateValue);
      if (isValidDate(dateValue)) {
        // the date can have a valid format but not pass min/max validation
        const dateString =
          timeStamp === true
            ? dateValue?.toISOString(true)
            : dateValue.format(DatePickerSaveFormatNoTimestamp);
        handleDataChange(dateString);
      }
    } else if (!dateValue) {
      setDate(null);
      handleDataChange('');
    } else if (
      dateValue.parsingFlags().charsLeftOver == 0 &&
      !dateValue.isValid()
    ) {
      setDate(dateValue);
    }
  };

  const isValidDate = (dateValue: moment.Moment): boolean => {
    if (!dateValue) {
      return true;
    }
    dateValue
      .set('hour', 12)
      .set('minute', 0)
      .set('second', 0)
      .set('millisecond', 0);
    return (
      dateValue.isValid() &&
      dateValue.isSameOrAfter(calculatedMinDate) &&
      dateValue.isSameOrBefore(calculatedMaxDate)
    );
  };

  const handleBlur = () => {
    const dateIsValid = isValidDate(date);
    setValidDate(dateIsValid);
    setValidationMessages(getValidationMessages());
    if (dateIsValid) {
      const dateString =
        timeStamp === false
          ? date?.format(DatePickerSaveFormatNoTimestamp)
          : date?.toISOString(true);
      const saveDate = isDateEmpty() ? '' : dateString;
      handleDataChange(saveDate);
    } else {
      if (formData?.simpleBinding) {
        handleDataChange('');
      }
    }
  };

  const mobileOnlyProps = isMobile
    ? {
        cancelLabel: getLanguageFromKey('date_picker.cancel_label', language),
        clearLabel: getLanguageFromKey('date_picker.clear_label', language),
        todayLabel: getLanguageFromKey('date_picker.today_label', language),
      }
    : {};

  return (
    <>
      <MuiPickersUtilsProvider utils={AltinnMomentUtils}>
        <Grid
          container
          item
          xs={12}
        >
          <KeyboardDatePicker
            readOnly={readOnly}
            required={required}
            variant={isMobile ? 'dialog' : 'inline'}
            format={calculatedFormat}
            margin='normal'
            id={id}
            data-testid={id}
            value={date}
            placeholder={calculatedFormat}
            key={id}
            onChange={handleDateChange}
            onBlur={handleBlur}
            autoOk={true}
            invalidDateMessage={emptyString}
            maxDateMessage={emptyString}
            minDateMessage={emptyString}
            minDate={calculatedMinDate}
            maxDate={calculatedMaxDate}
            InputProps={{
              disableUnderline: true,
              error: !isValid || !validDate,
              readOnly: readOnly,
              classes: {
                root:
                  classes.root +
                  (validationMessages?.errors?.length || !validDate
                    ? ` ${classes.invalid}`
                    : '') +
                  (readOnly ? ' disabled' : ''),
                input: classes.input,
              },
              ...(textResourceBindings?.description && {
                'aria-describedby': `description-${id}`,
              }),
            }}
            FormHelperTextProps={{
              classes: {
                root: classes.formHelperText,
              },
            }}
            KeyboardButtonProps={{
              'aria-label': getLanguageFromKey(
                'date_picker.aria_label_icon',
                language,
              ),
              id: 'date-icon-button',
            }}
            leftArrowButtonProps={{
              'aria-label': getLanguageFromKey(
                'date_picker.aria_label_left_arrow',
                language,
              ),
              id: 'date-left-icon-button',
            }}
            rightArrowButtonProps={{
              'aria-label': getLanguageFromKey(
                'date_picker.aria_label_right_arrow',
                language,
              ),
              id: 'date-right-icon-button',
            }}
            keyboardIcon={
              <Icon
                id='date-icon'
                className={`${classes.icon} ai ai-date`}
              />
            }
            className={classes.datepicker}
            {...mobileOnlyProps}
          />
        </Grid>
      </MuiPickersUtilsProvider>
      {renderValidationMessagesForComponent(
        validationMessages,
        `${id}_validations`,
      )}
    </>
  );
}

export default DatepickerComponent;
