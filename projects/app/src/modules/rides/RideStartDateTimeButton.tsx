import { format } from 'date-fns';
import React, { FC, useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useBooleanState } from '../../hooks/useBooleanState';
import { icons, ui } from '../../ui';

type RideStartDateTimeButtonProps = {
    onChange?: (date: Date) => void;
    ride: {
        startDate: Date | string | null;
        localStartDateString?: string | null;
        startTimezone: { id: string; name: string } | null;
    };
    onAddEvent?: () => void;
};

export const RideStartDateTimeButton: FC<RideStartDateTimeButtonProps> = ({ onChange, ride, onAddEvent }) => {
    const [now] = useState(() => new Date());
    const [calendarVisible, openCalendar, closeCalendar] = useBooleanState();
    const startDate = ride.startDate ? new Date(ride.startDate) : null;

    const date = (typeof ride.startDate === 'string' ? new Date(ride.startDate) : ride.startDate) ?? now;

    const addEventButton = onAddEvent && onChange && (
        <ui.Button
            marginLeft
            color='light'
            StartIcon={icons.Calendar}
            fillIcon={false}
            haptic
            disabled={!startDate}
            onPress={onAddEvent}
        />
    );

    return (
        <ui.Box marginBottom={2}>
            <ui.Box marginBottom={0.5} row justifyContent='space-between'>
                <ui.Text
                    variant='caption'
                    children='Start Date and Time'
                    colorPalette={!ride.startDate ? 'transparent' : undefined}
                />
                {ride.startTimezone && (
                    <ui.Text
                        variant='caption'
                        marginLeft
                        children={ride.startTimezone.name}
                        numberOfLines={1}
                        flex
                        textAlign='right'
                    />
                )}
            </ui.Box>
            <ui.Box row>
                <ui.Button
                    flex
                    color={onChange ? 'tertiary' : 'light'}
                    StartIcon={icons.Calendar}
                    alignItems='flex-start'
                    onPress={onChange ? openCalendar : onAddEvent}
                    children={
                        startDate
                            ? ride.localStartDateString ?? format(startDate, `dd MMMM 'at' p`)
                            : onChange
                              ? 'Start Date and Time'
                              : '- empty -'
                    }
                    caption={!ride.startDate}
                />

                {addEventButton}
            </ui.Box>

            {onChange && (
                <DateTimePickerModal
                    isVisible={calendarVisible}
                    minimumDate={now}
                    date={date}
                    mode='datetime'
                    onConfirm={(startDate) => {
                        onChange(startDate);
                        closeCalendar();
                    }}
                    onCancel={closeCalendar}
                />
            )}
        </ui.Box>
    );
};
