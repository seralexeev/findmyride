import BottomSheet from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { keepPreviousData } from '@tanstack/react-query';
import React, { FC, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRpc } from '../../api/rpc';
import { useTabNavigatorInset } from '../../hooks/useTabNavigatorInset';
import { icons, ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { useBottomSheetHelper } from '../../ui/components';
import { ChatListScreen } from '../chat/ChatListScreen';
import { FeedScreen } from '../feed/FeedScreen';
import { RidesList } from '../rides/RidesList';
import { RideFilter, useRidesFilter } from '../rides/filter/RideFilter';
import { useProfile } from '../user/ProfileProvider';
import { SearchUsersScreen } from '../user/SearchUsersScreen';
import { UserLocationButton } from '../user/UserLocationButton';

const snapPoints = [600];
export const HomeScreen: FC = () => {
    const { top } = useSafeAreaInsets();
    const [bottomSheetRef, bottomSheetProps] = useBottomSheetHelper(snapPoints);
    const { showScreen } = useScreen();
    const { filter, setFilter, isActive, clearFilter } = useRidesFilter();
    const { paddingBottom } = useTabNavigatorInset();
    const homeDataQuery = useRpc('home/data').useQuery({
        placeholderData: keepPreviousData,
        refetchInterval: 30000,
    });

    const { logout } = useProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useFocusEffect(useCallback(() => void homeDataQuery.refetch(), []));

    return (
        <ui.Screen topSafeArea={false} white name='HomeScreen'>
            <ui.Box flex paddingTop={`${top + 8}px`}>
                <ui.Box paddingHorizontal={2}>
                    <ui.Box row justifyContent='space-between' alignItems='center' marginBottom>
                        <ui.Text variant='title1' children='Rides' />
                        <ui.Box row>
                            <ui.Button
                                StartIcon={icons.Search}
                                color='transparent'
                                size='large'
                                onPress={() => showScreen({ children: <SearchUsersScreen /> })}
                            />
                            <ui.Button
                                StartIcon={icons.Bell}
                                color='transparent'
                                size='large'
                                fillIcon={false}
                                onPress={() => showScreen({ children: <FeedScreen /> })}
                                paddingBottom={0.5}
                            />
                            <ui.Box position='relative' onPress={() => showScreen({ children: <ChatListScreen /> })}>
                                <ui.Button
                                    StartIcon={icons.Messenger}
                                    color='transparent'
                                    size='large'
                                    fillIcon={false}
                                    paddingBottom={0.5}
                                />
                                {homeDataQuery.data && homeDataQuery.data.unreadMessages.count > 0 ? (
                                    <ui.Box
                                        absolute
                                        right={0}
                                        round
                                        bgPalette='primary'
                                        minWidth={16}
                                        height={16}
                                        paddingHorizontal={0.5}
                                        paddingTop={0.5}
                                    >
                                        <ui.Text
                                            children={homeDataQuery.data.unreadMessages.count}
                                            semiBold
                                            color='white'
                                            fontSize={10}
                                            center
                                        />
                                    </ui.Box>
                                ) : null}
                            </ui.Box>
                        </ui.Box>
                    </ui.Box>
                    <ui.Box row>
                        <UserLocationButton />
                        <ui.Box position='relative' overflow='visible'>
                            <ui.Button
                                color='tertiary'
                                StartIcon={icons.FilterSetting}
                                fillIcon={false}
                                onPress={() => bottomSheetRef.current?.expand()}
                            />
                            {isActive && (
                                <ui.Box round wh={12} bgPalette='primary' position='absolute' top={-0.5} right={-0.5} />
                            )}
                        </ui.Box>
                    </ui.Box>
                </ui.Box>

                <ui.Tabs flex lazy unmountOnChange={false}>
                    <ui.Tab name='List' title='List' flex backgroundColor Icon={icons.List}>
                        <RidesList
                            filter={filter}
                            paddingBottom={paddingBottom}
                            onRefresh={homeDataQuery.refetch}
                            ListHeaderComponent={
                                <ui.Text
                                    marginBottom={3}
                                    marginTop
                                    center
                                    children='🚴  Join rides that start nearby'
                                    semiBold
                                />
                            }
                        />
                    </ui.Tab>
                    <ui.Tab name='Map' title='Map' flex Icon={icons.Map}>
                        <ui.Text>RidesMap</ui.Text>
                        {/* <RidesMap filter={filter} setFilter={setFilter} /> */}
                    </ui.Tab>
                    {homeDataQuery.isSuccess && homeDataQuery.data.activeRides.count > 0 && (
                        <ui.Tab
                            name='Active'
                            title='Active'
                            customTitle={({ color }) => (
                                <ui.Box row alignItems='center'>
                                    <ui.LottieBox wh={32} source={require('../../ui/lottie/pulse.json')} autoPlay loop />
                                    <ui.Text color={color} children='Active' marginLeft />
                                </ui.Box>
                            )}
                            flex
                            backgroundColor
                        >
                            <RidesList filter={{ active: true }} paddingBottom={paddingBottom} />
                        </ui.Tab>
                    )}
                </ui.Tabs>
            </ui.Box>

            <BottomSheet
                ref={bottomSheetRef}
                {...bottomSheetProps}
                backdropComponent={ui.BottomSheetBackdrop}
                enablePanDownToClose
                index={-1}
            >
                <ui.Box borderBottomWidth borderColor>
                    <ui.Box paddingBottom={2} paddingTop row flexCenter>
                        <ui.Text variant='title2' center children='Filter' />
                        <ui.Box position='absolute' top={0.5} right>
                            <ui.Button color='transparent' children='Clear All' size='small' onPress={clearFilter} haptic />
                        </ui.Box>
                    </ui.Box>
                </ui.Box>
                <ui.BottomSheetScrollView paddingVertical>
                    <RideFilter filter={filter} setFilter={setFilter} />
                </ui.BottomSheetScrollView>
            </BottomSheet>
        </ui.Screen>
    );
};
