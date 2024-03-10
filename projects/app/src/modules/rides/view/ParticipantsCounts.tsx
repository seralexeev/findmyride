import { ParticipantStatus, RpcOutput } from '@findmyride/api';
import { capitalCase } from 'change-case';
import React, { FC, memo } from 'react';
import { ui } from '../../../ui';
import { getParticipantStatusColor } from './services';

type ParticipantsCountsProps = {
    ride: RpcOutput<'ride/get'>;
};

const visibleStatuses: ParticipantStatus[] = ['approved', 'declined', 'pending'];
export const ParticipantsCounts: FC<ParticipantsCountsProps> = memo(({ ride }) => {
    return (
        <ui.Box row justifyContent='space-between' alignItems='center' marginRight>
            <ui.Box row justifyContent='space-around' flex paddingRight>
                {visibleStatuses.map((status) => (
                    <ui.Box key={status} flexCenter>
                        <ui.Text variant='caption' children={capitalCase(status)} marginBottom={0.5} />
                        <ui.Box row>
                            <ui.Text
                                variant='caption'
                                fontSize={14}
                                semiBold
                                colorPalette={getParticipantStatusColor(status as ParticipantStatus)}
                                children={ride.participantsCounts[status] ?? 0}
                            />
                        </ui.Box>
                    </ui.Box>
                ))}
            </ui.Box>
        </ui.Box>
    );
});
