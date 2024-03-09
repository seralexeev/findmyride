import { getParticipantStatusColor } from '@app/modules/rides/view/services';
import { RpcOutput } from '@app/modules/rpc/useRpc';
import { ui } from '@app/ui';
import { ParticipantStatus } from '@shared/models/rides';
import { capitalCase } from 'change-case';
import React, { VFC } from 'react';

type ParticipantsCountsProps = {
    ride: RpcOutput<'getRide'>;
};

const visibleStatuses: ParticipantStatus[] = ['approved', 'declined', 'pending'];
export const ParticipantsCounts: VFC<ParticipantsCountsProps> = ({ ride }) => {
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
};
