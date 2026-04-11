import { Box, Tooltip } from "@mui/material";
import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const HolidayCalander = ({ title = true, highlightedDates, weeklyOffs }) => {
    // useEffect(() => {
    //     console.log(highlightedDates);
    // }, [highlightedDates]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="bg-white shadow rounded p-1 w-full max-w-md">
                {title && <p className="font-bold text-center text-xl text-slate-600">Holiday Calendar</p>}
                <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={null}
                    onChange={() => { }}
                    slots={{
                        day: (props) => {
                            const date = dayjs(props.day);

                            const matched = highlightedDates?.find(d => {
                                const hDate = dayjs(d.date);
                                return hDate.isValid() &&
                                    hDate.date() === date.date() &&
                                    hDate.month() === date.month() &&
                                    hDate.year() === date.year();
                            });

                            const isWeeklyOff = weeklyOffs?.includes(date.day());

                            const tooltipText = matched ? matched.name : (isWeeklyOff ? 'Weekly Off' : '');
                            {/* console.log('rendering day', date.format('YYYY-MM-DD'), !!matched) */ }

                            return (
                                <Tooltip title={tooltipText}>
                                    <PickersDay
                                        {...props}
                                        sx={{
                                            ...(isWeeklyOff && {
                                                backgroundColor: 'teal',
                                                borderRadius: '50%',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'darkcyan',
                                                    color: 'white',
                                                },
                                            }),
                                            ...(matched && {
                                                backgroundColor: '#d97706',
                                                borderRadius: '50%',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#b45309',
                                                    color: 'white',
                                                },
                                            }),
                                        }}
                                    />
                                </Tooltip>
                            );
                        },
                        actionBar: () => null // ✅ hides Cancel/OK buttons
                    }}
                />
            </Box>
        </LocalizationProvider>
    );
}

export default HolidayCalander;
