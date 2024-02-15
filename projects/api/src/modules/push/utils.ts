import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export const getRidePushTitle = (ride: {
    title: string | null;
    startName: string | null;
    startDate: Date;
    startTimezoneId: string;
}) => {
    return ride.title || `${ride.startName}, ${format(utcToZonedTime(ride.startDate, ride.startTimezoneId), `dd MMMM 'at' p`)}`;
};
